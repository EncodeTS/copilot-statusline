import { execSync } from 'child_process';
import * as fs from 'fs';
import {
    applyEdits,
    createScanner,
    modify,
    parse,
    parseTree,
    printParseErrorCode,
    type ParseError,
    type SyntaxKind
} from 'jsonc-parser/lib/esm/main.js';
import * as os from 'os';
import * as path from 'path';

interface CopilotConfig {
    footer?: {
        showCustom?: boolean;
        [key: string]: unknown;
    };
    statusLine?: {
        type?: string;
        command?: string;
        padding?: number;
    };
    [key: string]: unknown;
}

interface AtomicWriteTarget {
    filePath: string;
    mode: number;
}

const JSONC_COMMA_TOKEN = 5 as SyntaxKind;
const JSONC_EOF_TOKEN = 17 as SyntaxKind;

export type StatusLineState
    = | { kind: 'absent' }
        | { kind: 'owned'; command: string }
        | { kind: 'unrecognized'; command: string | null };

function getErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : undefined;
}

function getCopilotConfigDir(): string {
    const copilotHome = process.env.COPILOT_HOME?.trim();
    if (copilotHome) {
        return path.resolve(copilotHome);
    }

    return path.join(os.homedir(), '.copilot');
}

export function getCopilotConfigPath(): string {
    return path.join(getCopilotConfigDir(), 'settings.json');
}

function getScriptPath(): string {
    return path.join(getCopilotConfigDir(), process.platform === 'win32' ? 'statusline.cmd' : 'statusline.sh');
}

function resolveAtomicWriteTarget(filePath: string): AtomicWriteTarget {
    try {
        const stats = fs.lstatSync(filePath);
        if (!stats.isSymbolicLink()) {
            return {
                filePath,
                mode: stats.mode & 0o777
            };
        }

        let targetPath: string;
        try {
            targetPath = fs.realpathSync(filePath);
        } catch (error) {
            if (getErrorCode(error) !== 'ENOENT') {
                throw error;
            }
            targetPath = path.resolve(path.dirname(filePath), fs.readlinkSync(filePath));
        }

        const targetMode = fs.existsSync(targetPath)
            ? fs.statSync(targetPath).mode & 0o777
            : 0o600;
        return {
            filePath: targetPath,
            mode: targetMode
        };
    } catch (error) {
        if (getErrorCode(error) === 'ENOENT') {
            return {
                filePath,
                mode: 0o600
            };
        }
        throw error;
    }
}

function writeFileAtomically(filePath: string, content: string): void {
    const target = resolveAtomicWriteTarget(filePath);
    const targetDir = path.dirname(target.filePath);
    fs.mkdirSync(targetDir, {
        recursive: true,
        mode: 0o700
    });
    const tempPath = path.join(
        targetDir,
        `${path.basename(target.filePath)}.${process.pid}.${Date.now()}.tmp`
    );

    try {
        fs.writeFileSync(tempPath, content, {
            encoding: 'utf-8',
            mode: target.mode
        });
        fs.chmodSync(tempPath, target.mode);
        fs.renameSync(tempPath, target.filePath);
    } catch (error) {
        try {
            fs.unlinkSync(tempPath);
        } catch { /* best-effort cleanup */ }
        throw error;
    }
}

function parseCopilotConfig(content: string, configPath: string): CopilotConfig {
    try {
        const errors: ParseError[] = [];
        const parsed = parse(content, errors, {
            allowTrailingComma: true,
            disallowComments: false
        }) as unknown;
        if (errors.length > 0) {
            const firstError = errors[0];
            throw new Error(
                firstError
                    ? `${printParseErrorCode(firstError.error)} at offset ${firstError.offset}`
                    : 'invalid JSONC'
            );
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('expected a JSON object');
        }

        const root = parseTree(content, [], {
            allowTrailingComma: true,
            disallowComments: false
        });
        for (const key of ['footer', 'statusLine']) {
            const matchingProperties = root?.children?.filter(node => (
                node.type === 'property'
                && node.children?.[0]?.value === key
            )) ?? [];
            if (matchingProperties.length > 1) {
                throw new Error(`duplicate "${key}" properties are not supported`);
            }
        }

        return parsed as CopilotConfig;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const wrappedError: Error & { cause?: unknown } = new Error(`Failed to read ${configPath}: ${message}`);
        wrappedError.cause = error;
        throw wrappedError;
    }
}

function loadCopilotConfig(): CopilotConfig | null {
    const configPath = getCopilotConfigPath();
    if (!fs.existsSync(configPath)) {
        return null;
    }

    return parseCopilotConfig(fs.readFileSync(configPath, 'utf-8'), configPath);
}

function findCommaOffset(content: string, start: number, end: number): number | null {
    const scanner = createScanner(content, false);
    scanner.setPosition(start);
    for (let token = scanner.scan(); token !== JSONC_EOF_TOKEN; token = scanner.scan()) {
        const offset = scanner.getTokenOffset();
        if (offset >= end) {
            break;
        }
        if (token === JSONC_COMMA_TOKEN) {
            return offset;
        }
    }
    return null;
}

function removeStatusLineProperty(content: string): string {
    const root = parseTree(content, [], {
        allowTrailingComma: true,
        disallowComments: false
    });
    const property = root?.children?.find(node => (
        node.type === 'property'
        && node.children?.[0]?.value === 'statusLine'
    ));
    if (!property) {
        return content;
    }

    const properties = root?.children ?? [];
    const propertyIndex = properties.indexOf(property);
    const previousProperty = propertyIndex > 0 ? properties[propertyIndex - 1] : undefined;
    const nextProperty = propertyIndex >= 0 ? properties[propertyIndex + 1] : undefined;
    const propertyStart = property.offset;
    const propertyEnd = property.offset + property.length;

    if (nextProperty) {
        const commaOffset = findCommaOffset(content, propertyEnd, nextProperty.offset);
        if (commaOffset === null) {
            throw new Error('Could not safely remove statusLine from Copilot settings');
        }
        return content.slice(0, propertyStart) + content.slice(commaOffset + 1);
    }

    if (previousProperty) {
        const previousEnd = previousProperty.offset + previousProperty.length;
        const commaOffset = findCommaOffset(content, previousEnd, propertyStart);
        if (commaOffset === null) {
            throw new Error('Could not safely remove statusLine from Copilot settings');
        }
        return content.slice(0, commaOffset) + content.slice(propertyEnd);
    }

    return content.slice(0, propertyStart) + content.slice(propertyEnd);
}

function saveStatusLine(
    statusLine: CopilotConfig['statusLine'] | undefined,
    showCustom = false
): void {
    const configDir = getCopilotConfigDir();
    const configPath = getCopilotConfigPath();
    fs.mkdirSync(configDir, {
        recursive: true,
        mode: 0o700
    });

    const content = fs.existsSync(configPath)
        ? fs.readFileSync(configPath, 'utf-8')
        : '{}\n';
    parseCopilotConfig(content, configPath);

    let updated = statusLine === undefined
        ? removeStatusLineProperty(content)
        : applyEdits(
            content,
            modify(content, ['statusLine'], statusLine, {
                formattingOptions: {
                    eol: '\n',
                    insertSpaces: true,
                    tabSize: 2
                }
            })
        );
    if (showCustom) {
        updated = applyEdits(
            updated,
            modify(updated, ['footer', 'showCustom'], true, {
                formattingOptions: {
                    eol: '\n',
                    insertSpaces: true,
                    tabSize: 2
                }
            })
        );
    }
    parseCopilotConfig(updated, configPath);
    writeFileAtomically(configPath, updated);
}

export function getStatusLineState(): StatusLineState {
    const config = loadCopilotConfig();
    if (!config || !Object.prototype.hasOwnProperty.call(config, 'statusLine')) {
        return { kind: 'absent' };
    }

    const statusLine = config.statusLine as unknown;
    if (typeof statusLine !== 'object' || statusLine === null || Array.isArray(statusLine)) {
        return { kind: 'unrecognized', command: null };
    }

    const statusLineRecord = statusLine as Record<string, unknown>;
    const command = statusLineRecord.command;
    const type = statusLineRecord.type;
    if (
        typeof command !== 'string'
        || command.trim().length === 0
        || (type !== undefined && type !== 'command')
    ) {
        return {
            kind: 'unrecognized',
            command: typeof command === 'string' && command.length > 0 ? command : null
        };
    }

    return isKnownCommand(command)
        ? { kind: 'owned', command }
        : { kind: 'unrecognized', command };
}

export function getExistingStatusLine(): string | null {
    const state = getStatusLineState();
    return state.kind === 'absent' ? null : state.command;
}

export function canAutoInstallStatusLine(): boolean {
    const state = getStatusLineState();
    return state.kind === 'absent' || state.kind === 'owned';
}

export function isInstalled(): boolean {
    try {
        return getStatusLineState().kind === 'owned';
    } catch {
        return false;
    }
}

export function isKnownCommand(command: string): boolean {
    const normalizedCommand = command.trim().replace(/^(['"])(.*)\1$/, '$2');
    const expectedScript = getScriptPath();
    const pathMatches = process.platform === 'win32'
        ? normalizedCommand.toLowerCase() === expectedScript.toLowerCase()
        : normalizedCommand === expectedScript;
    if (pathMatches) {
        return true;
    }

    if (/^(?:bunx|npx)(?:\s+(?:-y|--yes))?\s+copilot-statusline(?:@(?:latest|\d+(?:\.\d+){2}(?:-[A-Za-z0-9.-]+)?))?$/.test(normalizedCommand)) {
        return true;
    }

    const executableMatch = /^(?:"([^"]+)"|'([^']+)'|(\S+))$/.exec(normalizedCommand);
    const executable = executableMatch?.[1] ?? executableMatch?.[2] ?? executableMatch?.[3];
    if (!executable) {
        return false;
    }

    const basename = path.basename(executable).toLowerCase();
    return basename === 'copilot-statusline' || basename === 'copilot-statusline.cmd';
}

function findRuntime(): string {
    // Detect what the user launched TUI with — prefer the same runtime
    // Bun sets the BUN_INSTALL env var; also check if process.argv[0] contains "bun"
    const isBunRuntime = typeof Bun !== 'undefined'
        || process.env.BUN_INSTALL !== undefined
        || (process.argv[0] ?? '').includes('bun');

    if (isBunRuntime) {
        return 'bun';
    }

    // Fallback: check if bun is available
    try {
        execSync('bun --version', { stdio: 'ignore' });
        return 'bun';
    } catch { /* ignore */ }

    return 'node';
}

function generateUnixScript(): string {
    const runtime = findRuntime();
    const runner = runtime === 'bun' ? 'bunx' : 'npx';
    return `#!/bin/bash
# copilot-statusline - auto-generated launcher
# Uses ${runner} to always run the latest version.
# Buffers stdin because Copilot CLI closes the pipe before slow runtimes start.
if [ -t 0 ]; then
  exec ${runner} -y copilot-statusline@latest "$@"
else
  INPUT=$(cat)
  echo "$INPUT" | exec ${runner} -y copilot-statusline@latest "$@"
fi
`;
}

function generateWindowsScript(): string {
    const runtime = findRuntime();
    const runner = runtime === 'bun' ? 'bunx' : 'npx';
    return `@echo off\r\nREM copilot-statusline - auto-generated launcher\r\n${runner} -y copilot-statusline@latest %*\r\n`;
}

function isManagedLauncherFile(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('copilot-statusline - auto-generated launcher')
            || content.includes('copilot-statusline — auto-generated launcher');
    } catch {
        return false;
    }
}

export function installStatusLine(): void {
    const scriptPath = getScriptPath();
    loadCopilotConfig();
    fs.mkdirSync(getCopilotConfigDir(), {
        recursive: true,
        mode: 0o700
    });

    // Generate and write the launcher script
    if (process.platform === 'win32') {
        fs.writeFileSync(scriptPath, generateWindowsScript());
    } else {
        fs.writeFileSync(scriptPath, generateUnixScript());
        fs.chmodSync(scriptPath, 0o755);
    }

    // Write settings.json pointing to the script.
    saveStatusLine(
        {
            type: 'command',
            command: scriptPath,
            padding: 0
        },
        true
    );
}

export function uninstallStatusLine(): void {
    const state = getStatusLineState();
    if (state.kind === 'unrecognized') {
        throw new Error('Refusing to remove a status line not managed by copilot-statusline');
    }
    const scriptPath = getScriptPath();
    if (state.kind === 'owned') {
        saveStatusLine(undefined);

        // Remove only the launcher positively referenced by settings and carrying
        // our generated-file marker.
        const normalizedCommand = state.command.trim().replace(/^(['"])(.*)\1$/, '$2');
        if (normalizedCommand === scriptPath && isManagedLauncherFile(scriptPath)) {
            fs.unlinkSync(scriptPath);
        }
    }
}

export function isBunxAvailable(): boolean {
    try {
        execSync('bun --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}