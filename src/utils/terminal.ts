import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PACKAGE_VERSION = '__PACKAGE_VERSION__';

export function getPackageVersion(): string {
    if (/^\d+\.\d+\.\d+/.test(PACKAGE_VERSION)) {
        return PACKAGE_VERSION;
    }

    const possiblePaths = [
        path.join(__dirname, '..', '..', 'package.json'),
        path.join(__dirname, '..', 'package.json')
    ];

    for (const packageJsonPath of possiblePaths) {
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version?: string };
                return packageJson.version ?? '';
            }
        } catch {
            // Continue to next path
        }
    }

    return '';
}

function probeTerminalWidth(): number | null {
    if (process.platform === 'win32') {
        return null;
    }

    let pid = process.pid;
    for (let depth = 0; depth < 8; depth += 1) {
        const parentPid = getParentProcessId(pid);
        if (parentPid === null) {
            break;
        }

        pid = parentPid;

        const tty = getTTYForProcess(pid);
        if (tty === null) {
            continue;
        }

        const width = getWidthForTTY(tty);
        if (width !== null) {
            return width;
        }
    }

    try {
        const width = execSync('tput cols 2>/dev/null', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        return parsePositiveInteger(width);
    } catch {
        // tput also failed
    }

    return null;
}

function parsePositiveInteger(value: string): number | null {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

function getParentProcessId(pid: number): number | null {
    try {
        const parentPidOutput = execSync(`ps -o ppid= -p ${pid}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            shell: '/bin/sh'
        }).trim();

        return parsePositiveInteger(parentPidOutput);
    } catch {
        return null;
    }
}

function getTTYForProcess(pid: number): string | null {
    try {
        const tty = execSync(`ps -o tty= -p ${pid}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            shell: '/bin/sh'
        }).replace(/\s+/g, '');

        if (!tty || tty === '??' || tty === '?') {
            return null;
        }

        return tty;
    } catch {
        return null;
    }
}

function getWidthForTTY(tty: string): number | null {
    try {
        const width = execSync(
            `stty size < /dev/${tty} | awk '{print $2}'`,
            {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
                shell: '/bin/sh'
            }
        ).trim();

        return parsePositiveInteger(width);
    } catch {
        return null;
    }
}

export function getTerminalWidth(): number | null {
    return probeTerminalWidth();
}

export function canDetectTerminalWidth(): boolean {
    return probeTerminalWidth() !== null;
}