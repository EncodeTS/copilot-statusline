import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    afterAll,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    canAutoInstallStatusLine,
    getCopilotConfigPath,
    getExistingStatusLine,
    getStatusLineState,
    installStatusLine,
    isInstalled,
    isKnownCommand,
    uninstallStatusLine
} from '../copilot-settings';

const TEST_HOME = path.join(os.tmpdir(), 'copilot-statusline-copilot-home');
const ORIGINAL_COPILOT_HOME = process.env.COPILOT_HOME;

function getSettingsPath(): string {
    return path.join(TEST_HOME, 'settings.json');
}

function getLauncherPath(): string {
    return path.join(TEST_HOME, process.platform === 'win32' ? 'statusline.cmd' : 'statusline.sh');
}

function writeSettings(content: string): void {
    fs.mkdirSync(TEST_HOME, { recursive: true });
    fs.writeFileSync(getSettingsPath(), content, 'utf-8');
}

describe('Copilot CLI settings integration', () => {
    beforeEach(() => {
        fs.rmSync(TEST_HOME, { recursive: true, force: true });
        process.env.COPILOT_HOME = TEST_HOME;
    });

    afterAll(() => {
        fs.rmSync(TEST_HOME, { recursive: true, force: true });
        if (ORIGINAL_COPILOT_HOME === undefined) {
            delete process.env.COPILOT_HOME;
        } else {
            process.env.COPILOT_HOME = ORIGINAL_COPILOT_HOME;
        }
    });

    it('targets the current settings.json location under COPILOT_HOME', () => {
        expect(getCopilotConfigPath()).toBe(getSettingsPath());
    });

    it('installs without overwriting unrelated Copilot settings', () => {
        writeSettings(JSON.stringify({
            model: 'gpt-5.6-sol',
            theme: 'github'
        }));

        installStatusLine();

        const settings = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8')) as {
            footer?: { showCustom?: boolean };
            model?: string;
            theme?: string;
            statusLine?: { type?: string; command?: string; padding?: number };
        };
        expect(settings.model).toBe('gpt-5.6-sol');
        expect(settings.theme).toBe('github');
        expect(settings.statusLine).toEqual({
            type: 'command',
            command: getLauncherPath(),
            padding: 0
        });
        expect(settings.footer?.showCustom).toBe(true);
        expect(fs.existsSync(getLauncherPath())).toBe(true);
        expect(getExistingStatusLine()).toBe(getLauncherPath());
        expect(isInstalled()).toBe(true);
    });

    it('recognizes a command when the optional statusLine type is omitted', () => {
        writeSettings(JSON.stringify({ statusLine: { command: getLauncherPath() } }));

        expect(getExistingStatusLine()).toBe(getLauncherPath());
        expect(isInstalled()).toBe(true);
    });

    it('ignores a malformed non-string statusLine command', () => {
        writeSettings(JSON.stringify({
            statusLine: {
                type: 'command',
                command: 42
            }
        }));

        expect(getExistingStatusLine()).toBeNull();
        expect(isInstalled()).toBe(false);
        expect(getStatusLineState()).toEqual({
            kind: 'unrecognized',
            command: null
        });
        expect(canAutoInstallStatusLine()).toBe(false);
    });

    it('uninstalls while preserving unrelated Copilot settings', () => {
        writeSettings(JSON.stringify({ theme: 'github' }));
        installStatusLine();

        uninstallStatusLine();

        const settings = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8')) as {
            theme?: string;
            statusLine?: unknown;
        };
        expect(settings.theme).toBe('github');
        expect(settings.statusLine).toBeUndefined();
        expect(fs.existsSync(getLauncherPath())).toBe(false);
    });

    it('does not overwrite invalid settings JSON', () => {
        writeSettings('{ invalid json');

        expect(() => { installStatusLine(); }).toThrow('Failed to read');
        expect(fs.readFileSync(getSettingsPath(), 'utf-8')).toBe('{ invalid json');
        expect(fs.existsSync(getLauncherPath())).toBe(false);
    });

    it('installs when COPILOT_HOME does not exist yet', () => {
        installStatusLine();

        expect(fs.existsSync(getSettingsPath())).toBe(true);
        expect(fs.existsSync(getLauncherPath())).toBe(true);
        if (process.platform !== 'win32') {
            expect(fs.statSync(TEST_HOME).mode & 0o777).toBe(0o700);
            expect(fs.statSync(getSettingsPath()).mode & 0o777).toBe(0o600);
        }
    });

    it('enables custom footer output while preserving other footer settings', () => {
        writeSettings(JSON.stringify({
            footer: {
                showBranch: false,
                showCustom: false
            }
        }));

        installStatusLine();

        const settings = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8')) as { footer?: { showBranch?: boolean; showCustom?: boolean } };
        expect(settings.footer).toEqual({
            showBranch: false,
            showCustom: true
        });
    });

    it('preserves comments and trailing commas in settings.json', () => {
        writeSettings(`{
  // Keep this user comment.
  "model": "gpt-5.6-sol",
}`);

        installStatusLine();
        const installedContent = fs.readFileSync(getSettingsPath(), 'utf-8');
        expect(installedContent).toContain('// Keep this user comment.');
        expect(installedContent).toContain('"model": "gpt-5.6-sol"');

        uninstallStatusLine();
        const uninstalledContent = fs.readFileSync(getSettingsPath(), 'utf-8');
        expect(uninstalledContent).toContain('// Keep this user comment.');
        expect(uninstalledContent).toContain('"model": "gpt-5.6-sol"');
        expect(uninstalledContent).not.toContain('"statusLine"');
    });

    it('preserves a comment attached to the setting after statusLine', () => {
        writeSettings(`{
  "statusLine": {
    "type": "command",
    "command": "${getLauncherPath()}"
  },
  // Keep the theme explanation.
  "theme": "github"
}`);

        uninstallStatusLine();

        const content = fs.readFileSync(getSettingsPath(), 'utf-8');
        expect(content).toContain('// Keep the theme explanation.');
        expect(content).toContain('"theme": "github"');
        expect(content).not.toContain('"statusLine"');
    });

    it('safely removes a statusLine with a comment before its comma', () => {
        writeSettings(`{
  "statusLine": {
    "type": "command",
    "command": "${getLauncherPath()}"
  } /* status line note */,
  "theme": "github"
}`);

        uninstallStatusLine();

        const content = fs.readFileSync(getSettingsPath(), 'utf-8');
        expect(content).toContain('"theme": "github"');
        expect(content).not.toContain('"statusLine"');
        expect(() => {
            JSON.parse(content);
        }).not.toThrow();
    });

    it('does not claim or remove an unrelated status line', () => {
        writeSettings(JSON.stringify({
            statusLine: {
                type: 'command',
                command: '/Users/example/custom-statusline.sh'
            }
        }));

        expect(isKnownCommand('/Users/example/custom-statusline.sh')).toBe(false);
        expect(isInstalled()).toBe(false);
        expect(() => {
            uninstallStatusLine();
        }).toThrow('not managed by copilot-statusline');
        expect(getExistingStatusLine()).toBe('/Users/example/custom-statusline.sh');
    });

    it('matches only strict package commands and executables', () => {
        expect(isKnownCommand('npx -y copilot-statusline@latest')).toBe(true);
        expect(isKnownCommand('bunx copilot-statusline@0.1.21')).toBe(true);
        expect(isKnownCommand('/usr/local/bin/copilot-statusline')).toBe(true);
        expect(isKnownCommand('printf copilot-statusline')).toBe(false);
        expect(isKnownCommand('/usr/local/bin/copilot-statusline-custom')).toBe(false);
        expect(isKnownCommand('npx -y copilot-statusline@latest && printf unrelated')).toBe(false);
    });

    it('requires positive ownership before uninstalling malformed statusLine settings', () => {
        writeSettings(JSON.stringify({ statusLine: { type: 'command' } }));

        expect(canAutoInstallStatusLine()).toBe(false);
        expect(() => {
            uninstallStatusLine();
        }).toThrow('not managed by copilot-statusline');
        expect(fs.readFileSync(getSettingsPath(), 'utf-8')).toContain('"statusLine"');
    });

    it('rejects duplicate managed JSONC properties before editing', () => {
        writeSettings(`{
  "statusLine": { "command": "${getLauncherPath()}" },
  "statusLine": { "command": "/Users/example/custom-statusline.sh" }
}`);

        expect(() => {
            installStatusLine();
        }).toThrow('duplicate "statusLine"');
        expect(fs.existsSync(getLauncherPath())).toBe(false);
    });

    it('does not delete an unrelated launcher file when statusLine is absent', () => {
        writeSettings('{ "theme": "github" }');
        fs.writeFileSync(getLauncherPath(), '#!/bin/bash\necho unrelated\n', 'utf-8');

        uninstallStatusLine();

        expect(fs.existsSync(getLauncherPath())).toBe(true);
        expect(fs.readFileSync(getLauncherPath(), 'utf-8')).toContain('unrelated');
    });

    it('preserves a symlinked settings file', () => {
        if (process.platform === 'win32') {
            return;
        }

        const targetDir = path.join(TEST_HOME, 'managed');
        const targetPath = path.join(targetDir, 'settings.json');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetPath, '{ "theme": "github" }', 'utf-8');
        fs.symlinkSync(targetPath, getSettingsPath());

        installStatusLine();

        expect(fs.lstatSync(getSettingsPath()).isSymbolicLink()).toBe(true);
        const targetSettings = JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as {
            theme?: string;
            statusLine?: { command?: string };
        };
        expect(targetSettings.theme).toBe('github');
        expect(targetSettings.statusLine?.command).toBe(getLauncherPath());
    });

    it('preserves existing settings file permissions across atomic replacement', () => {
        if (process.platform === 'win32') {
            return;
        }

        writeSettings('{ "theme": "github" }');
        fs.chmodSync(getSettingsPath(), 0o660);

        installStatusLine();

        expect(fs.statSync(getSettingsPath()).mode & 0o777).toBe(0o660);
    });
});