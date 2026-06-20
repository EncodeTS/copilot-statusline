import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
    CURRENT_VERSION,
    SettingsSchema,
    type Settings
} from '../types/Settings';

const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const mkdir = fs.promises.mkdir;
const rename = fs.promises.rename;
const unlink = fs.promises.unlink;
const lstat = fs.promises.lstat;
const readlink = fs.promises.readlink;
const realpath = fs.promises.realpath;

const DEFAULT_SETTINGS_PATH = path.join(os.homedir(), '.config', 'copilot-statusline', 'settings.json');

let settingsPath = DEFAULT_SETTINGS_PATH;
let lastLoadError: string | null = null;

export function getConfigLoadError(): string | null {
    return lastLoadError;
}

export function initConfigPath(filePath?: string): void {
    settingsPath = filePath ? path.resolve(filePath) : DEFAULT_SETTINGS_PATH;
}

export function getConfigPath(): string {
    return settingsPath;
}

export function isCustomConfigPath(): boolean {
    return settingsPath !== DEFAULT_SETTINGS_PATH;
}

interface SettingsPaths {
    configDir: string;
    settingsPath: string;
}

interface AtomicWriteTarget {
    targetPath: string;
    tempDir: string;
}

function getSettingsPaths(): SettingsPaths {
    return {
        configDir: path.dirname(settingsPath),
        settingsPath
    };
}

function getErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : undefined;
}

async function resolveSymlinkTarget(linkPath: string): Promise<string> {
    try {
        return await realpath(linkPath);
    } catch (error) {
        if (getErrorCode(error) !== 'ENOENT') {
            throw error;
        }

        const linkTarget = await readlink(linkPath);
        return path.resolve(path.dirname(linkPath), linkTarget);
    }
}

async function resolveAtomicWriteTarget(paths: SettingsPaths): Promise<AtomicWriteTarget> {
    try {
        const stats = await lstat(paths.settingsPath);
        if (!stats.isSymbolicLink()) {
            return {
                targetPath: paths.settingsPath,
                tempDir: paths.configDir
            };
        }

        const targetPath = await resolveSymlinkTarget(paths.settingsPath);
        return {
            targetPath,
            tempDir: path.dirname(targetPath)
        };
    } catch (error) {
        if (getErrorCode(error) === 'ENOENT') {
            return {
                targetPath: paths.settingsPath,
                tempDir: paths.configDir
            };
        }

        throw error;
    }
}

async function writeSettingsJson(settings: unknown, paths: SettingsPaths): Promise<void> {
    await mkdir(paths.configDir, { recursive: true });

    const writeTarget = await resolveAtomicWriteTarget(paths);
    await mkdir(writeTarget.tempDir, { recursive: true });
    const tempPath = path.join(
        writeTarget.tempDir,
        `${path.basename(writeTarget.targetPath)}.${process.pid}.${Date.now()}.tmp`
    );

    try {
        await writeFile(tempPath, JSON.stringify(settings, null, 2), 'utf-8');
        await rename(tempPath, writeTarget.targetPath);
    } catch (error) {
        try {
            await unlink(tempPath);
        } catch { /* best-effort cleanup */ }
        throw error;
    }
}

function inMemoryDefaults(): Settings {
    return SettingsSchema.parse({});
}

async function writeDefaultSettings(paths: SettingsPaths): Promise<Settings> {
    const defaults = inMemoryDefaults();
    const settingsWithVersion = {
        ...defaults,
        version: CURRENT_VERSION
    };

    try {
        await writeSettingsJson(settingsWithVersion, paths);
        console.error(`Default settings written to ${paths.settingsPath}`);
    } catch (error) {
        console.error('Failed to write default settings:', error);
    }

    return defaults;
}

export async function loadSettings(): Promise<Settings> {
    lastLoadError = null;
    const paths = getSettingsPaths();

    try {
        if (!fs.existsSync(paths.settingsPath))
            return await writeDefaultSettings(paths);

        const content = await readFile(paths.settingsPath, 'utf-8');
        let rawData: unknown;

        try {
            rawData = JSON.parse(content);
        } catch {
            console.error('Failed to parse settings.json, using defaults (file left unchanged)');
            lastLoadError = 'settings.json is not valid JSON';
            return inMemoryDefaults();
        }

        const result = SettingsSchema.safeParse(rawData);
        if (!result.success) {
            console.error('Failed to parse settings, using defaults (file left unchanged):', result.error);
            lastLoadError = 'settings.json is not in a valid format';
            return inMemoryDefaults();
        }

        return result.data;
    } catch (error) {
        console.error('Error loading settings, using defaults:', error);
        lastLoadError = 'settings.json could not be read';
        return inMemoryDefaults();
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    const paths = getSettingsPaths();

    const settingsWithVersion = {
        ...settings,
        version: CURRENT_VERSION
    };

    await writeSettingsJson(settingsWithVersion, paths);
}