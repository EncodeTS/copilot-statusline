import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface CopilotConfig {
    statusLine?: {
        type?: string;
        command?: string;
        padding?: number;
    };
    [key: string]: unknown;
}

function getCopilotConfigDir(): string {
    return path.join(os.homedir(), '.copilot');
}

export function getCopilotConfigPath(): string {
    return path.join(getCopilotConfigDir(), 'config.json');
}

function getScriptPath(): string {
    return path.join(getCopilotConfigDir(), process.platform === 'win32' ? 'statusline.cmd' : 'statusline.sh');
}

function loadCopilotConfig(): CopilotConfig | null {
    try {
        const configPath = getCopilotConfigPath();
        if (!fs.existsSync(configPath)) {
            return null;
        }
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content) as CopilotConfig;
    } catch {
        return null;
    }
}

function saveCopilotConfig(config: CopilotConfig): void {
    const configPath = getCopilotConfigPath();
    const configDir = getCopilotConfigDir();
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function getExistingStatusLine(): string | null {
    const config = loadCopilotConfig();
    if (config?.statusLine?.type === 'command' && config.statusLine.command) {
        return config.statusLine.command;
    }
    return null;
}

export function isInstalled(): boolean {
    const command = getExistingStatusLine();
    return command !== null && isKnownCommand(command);
}

export function isKnownCommand(command: string): boolean {
    return command.includes('copilot-statusline') || command.includes('statusline.sh') || command.includes('statusline.cmd');
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
# copilot-statusline — auto-generated launcher
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
    return `@echo off\r\n${runner} -y copilot-statusline@latest %*\r\n`;
}

export function installStatusLine(): void {
    const scriptPath = getScriptPath();

    // Generate and write the launcher script
    if (process.platform === 'win32') {
        fs.writeFileSync(scriptPath, generateWindowsScript());
    } else {
        fs.writeFileSync(scriptPath, generateUnixScript());
        fs.chmodSync(scriptPath, 0o755);
    }

    // Write config.json pointing to the script
    const config = loadCopilotConfig() ?? {};
    config.statusLine = {
        type: 'command',
        command: scriptPath,
        padding: 0
    };
    saveCopilotConfig(config);
}

export function uninstallStatusLine(): void {
    // Remove script file
    const scriptPath = getScriptPath();
    try {
        if (fs.existsSync(scriptPath)) {
            fs.unlinkSync(scriptPath);
        }
    } catch { /* ignore */ }

    // Remove statusLine from config
    const config = loadCopilotConfig();
    if (!config) {
        return;
    }
    delete config.statusLine;
    saveCopilotConfig(config);
}

export function isBunxAvailable(): boolean {
    try {
        execSync('bun --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}