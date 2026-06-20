import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    afterAll,
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    CURRENT_VERSION,
    DEFAULT_SETTINGS
} from '../../types/Settings';
import {
    getConfigLoadError,
    initConfigPath,
    loadSettings,
    saveSettings
} from '../config';

const MOCK_HOME_DIR = path.join(os.tmpdir(), 'copilot-statusline-config-test-home');

function getSettingsPaths(): { configDir: string; settingsPath: string; backupPath: string } {
    const configDir = path.join(MOCK_HOME_DIR, '.config', 'copilot-statusline');
    return {
        configDir,
        settingsPath: path.join(configDir, 'settings.json'),
        backupPath: path.join(configDir, 'settings.bak')
    };
}

describe('config utilities', () => {
    beforeEach(() => {
        fs.rmSync(MOCK_HOME_DIR, { recursive: true, force: true });
        const { settingsPath } = getSettingsPaths();
        initConfigPath(settingsPath);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(() => {
        fs.rmSync(MOCK_HOME_DIR, { recursive: true, force: true });
        initConfigPath();
    });

    it('writes defaults when settings file does not exist', async () => {
        const { settingsPath } = getSettingsPaths();

        const settings = await loadSettings();

        expect(settings.version).toBe(CURRENT_VERSION);
        expect(fs.existsSync(settingsPath)).toBe(true);

        const onDisk = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as { version?: number; lines?: unknown[] };
        expect(onDisk.version).toBe(CURRENT_VERSION);
        expect(Array.isArray(onDisk.lines)).toBe(true);
        expect(getConfigLoadError()).toBeNull();
    });

    it('uses defaults in memory and preserves invalid JSON without overwriting', async () => {
        const { settingsPath, backupPath, configDir } = getSettingsPaths();
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(settingsPath, '{ invalid json', 'utf-8');

        const settings = await loadSettings();

        expect(settings.version).toBe(CURRENT_VERSION);
        expect(fs.readFileSync(settingsPath, 'utf-8')).toBe('{ invalid json');
        expect(fs.existsSync(backupPath)).toBe(false);
        expect(getConfigLoadError()).toContain('settings.json');
    });

    it('uses defaults in memory and preserves invalid schema without overwriting', async () => {
        const { settingsPath, backupPath, configDir } = getSettingsPaths();
        fs.mkdirSync(configDir, { recursive: true });
        const original = JSON.stringify({ version: CURRENT_VERSION, lines: 42 });
        fs.writeFileSync(settingsPath, original, 'utf-8');

        const settings = await loadSettings();

        expect(settings.version).toBe(CURRENT_VERSION);
        expect(fs.readFileSync(settingsPath, 'utf-8')).toBe(original);
        expect(fs.existsSync(backupPath)).toBe(false);
        expect(getConfigLoadError()).toContain('settings.json');
    });

    it('clears config load errors after loading a valid config', async () => {
        const { settingsPath, configDir } = getSettingsPaths();
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(settingsPath, '{ invalid json', 'utf-8');

        await loadSettings();
        expect(getConfigLoadError()).not.toBeNull();

        fs.writeFileSync(settingsPath, JSON.stringify({ version: CURRENT_VERSION, lines: [[], [], []] }), 'utf-8');

        await loadSettings();
        expect(getConfigLoadError()).toBeNull();
    });

    it('saves settings without leaving a temp file behind', async () => {
        const { settingsPath, configDir } = getSettingsPaths();

        await saveSettings({ ...DEFAULT_SETTINGS });

        const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as { version?: number };
        expect(saved.version).toBe(CURRENT_VERSION);
        expect(fs.readdirSync(configDir).filter(name => name.endsWith('.tmp'))).toEqual([]);
    });

    it('saves through a symlinked settings file without replacing the link', async () => {
        const { settingsPath, configDir } = getSettingsPaths();
        const targetDir = path.join(MOCK_HOME_DIR, 'dotfiles', 'copilot-statusline');
        const targetPath = path.join(targetDir, 'settings.json');
        fs.mkdirSync(configDir, { recursive: true });
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetPath, JSON.stringify({ version: CURRENT_VERSION, lines: [[], [], []], flexMode: 'full' }), 'utf-8');
        fs.symlinkSync(targetPath, settingsPath);

        await saveSettings({
            ...DEFAULT_SETTINGS,
            flexMode: 'full-minus-40'
        });

        expect(fs.lstatSync(settingsPath).isSymbolicLink()).toBe(true);
        expect(fs.realpathSync(settingsPath)).toBe(fs.realpathSync(targetPath));

        const saved = JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as {
            flexMode?: string;
            version?: number;
        };
        expect(saved.version).toBe(CURRENT_VERSION);
        expect(saved.flexMode).toBe('full-minus-40');
        expect(fs.readdirSync(configDir).filter(name => name.endsWith('.tmp'))).toEqual([]);
        expect(fs.readdirSync(targetDir).filter(name => name.endsWith('.tmp'))).toEqual([]);
    });

    it('cleans up the temp file and rethrows when the target cannot be replaced', async () => {
        const { settingsPath, configDir } = getSettingsPaths();
        fs.mkdirSync(configDir, { recursive: true });
        fs.mkdirSync(settingsPath, { recursive: true });

        await expect(saveSettings({ ...DEFAULT_SETTINGS })).rejects.toThrow();

        expect(fs.statSync(settingsPath).isDirectory()).toBe(true);
        expect(fs.readdirSync(configDir).filter(name => name.endsWith('.tmp'))).toEqual([]);
    });
});