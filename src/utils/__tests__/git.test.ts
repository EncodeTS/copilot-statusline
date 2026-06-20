import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import {
    clearGitCache,
    resolveGitCwd,
    runGit
} from '../git';

let mockExecFileSync: {
    mock: { calls: unknown[][] };
    mockReturnValueOnce: (value: string) => void;
};

const ORIGINAL_HOME = process.env.HOME;
const ORIGINAL_USERPROFILE = process.env.USERPROFILE;
const tempPaths: string[] = [];

function useTempHome(): string {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-statusline-git-home-'));
    tempPaths.push(home);
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    return home;
}

function createGitRepo(): { root: string; headPath: string; indexPath: string; configPath: string; headRefPath: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-statusline-git-repo-'));
    tempPaths.push(root);
    const gitDir = path.join(root, '.git');
    const refsDir = path.join(gitDir, 'refs', 'heads');
    fs.mkdirSync(gitDir, { recursive: true });
    fs.mkdirSync(refsDir, { recursive: true });
    const headPath = path.join(gitDir, 'HEAD');
    const indexPath = path.join(gitDir, 'index');
    const configPath = path.join(gitDir, 'config');
    const headRefPath = path.join(refsDir, 'main');
    fs.writeFileSync(headPath, 'ref: refs/heads/main\n', 'utf-8');
    fs.writeFileSync(indexPath, '', 'utf-8');
    fs.writeFileSync(configPath, '[core]\n\trepositoryformatversion = 0\n', 'utf-8');
    fs.writeFileSync(headRefPath, '0000000000000000000000000000000000000000\n', 'utf-8');
    return { root, headPath, indexPath, configPath, headRefPath };
}

function touch(filePath: string, mtimeMs: number): void {
    const date = new Date(mtimeMs);
    fs.utimesSync(filePath, date, date);
}

function getOnlyGitCachePath(home: string): string {
    const cacheDir = path.join(home, '.cache', 'copilot-statusline', 'git-cache');
    const files = fs.readdirSync(cacheDir).filter(file => /^git-[a-f0-9]+\.json$/.test(file));
    expect(files).toHaveLength(1);
    return path.join(cacheDir, files[0] ?? '');
}

function readGitCacheJson(home: string): { entries?: Record<string, unknown> } {
    return JSON.parse(fs.readFileSync(getOnlyGitCachePath(home), 'utf-8')) as { entries?: Record<string, unknown> };
}

describe('git utils', () => {
    beforeEach(() => {
        mockExecFileSync = vi.spyOn(childProcess, 'execFileSync') as unknown as typeof mockExecFileSync;
        clearGitCache();
    });

    afterEach(() => {
        clearGitCache();
        vi.restoreAllMocks();
        if (ORIGINAL_HOME === undefined) {
            delete process.env.HOME;
        } else {
            process.env.HOME = ORIGINAL_HOME;
        }
        if (ORIGINAL_USERPROFILE === undefined) {
            delete process.env.USERPROFILE;
        } else {
            process.env.USERPROFILE = ORIGINAL_USERPROFILE;
        }

        while (tempPaths.length > 0) {
            const tempPath = tempPaths.pop();
            if (tempPath) {
                fs.rmSync(tempPath, { recursive: true, force: true });
            }
        }
    });

    it('resolves git cwd from payload cwd before workspace current_dir', () => {
        const context: RenderContext = {
            data: {
                cwd: '/repo/from/cwd',
                workspace: { current_dir: '/repo/from/current-dir' }
            }
        };

        expect(resolveGitCwd(context)).toBe('/repo/from/cwd');
    });

    it('runs git with resolved cwd, lock avoidance env, and hidden windows', () => {
        mockExecFileSync.mockReturnValueOnce('feature/worktree\n');
        const context: RenderContext = { data: { cwd: '/tmp/repo' } };

        const result = runGit('branch --show-current', context);

        expect(result).toBe('feature/worktree');
        const call = mockExecFileSync.mock.calls[0];
        expect(call?.[0]).toBe('git');
        expect(call?.[1]).toEqual(['branch', '--show-current']);
        const options = call?.[2] as { cwd?: string; env?: Record<string, string | undefined>; windowsHide?: boolean } | undefined;
        expect(options?.cwd).toBe('/tmp/repo');
        expect(options?.env?.GIT_OPTIONAL_LOCKS).toBe('0');
        expect(options?.windowsHide).toBe(true);
    });

    it('reuses in-process cache entries while repo mtimes and TTL remain valid', () => {
        useTempHome();
        const { root } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 5 };
        mockExecFileSync.mockReturnValueOnce('feature/cache\n');

        expect(runGit('branch --show-current', context)).toBe('feature/cache');
        expect(runGit('branch --show-current', context)).toBe('feature/cache');

        expect(mockExecFileSync.mock.calls).toHaveLength(1);
    });

    it('reuses valid persistent cache entries after in-process cache is cleared', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        const home = useTempHome();
        const { root } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 5 };
        mockExecFileSync.mockReturnValueOnce('feature/persisted\n');

        expect(runGit('branch --show-current', context)).toBe('feature/persisted');
        expect(fs.existsSync(getOnlyGitCachePath(home))).toBe(true);

        clearGitCache();
        expect(runGit('branch --show-current', context)).toBe('feature/persisted');
        expect(mockExecFileSync.mock.calls).toHaveLength(1);
    });

    it('stores persistent cache entries by command and cwd', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        const home = useTempHome();
        const { root } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 5 };
        mockExecFileSync.mockReturnValueOnce('1 file changed, 2 insertions(+)');

        expect(runGit('diff --cached --shortstat', context)).toBe('1 file changed, 2 insertions(+)');

        const cache = readGitCacheJson(home);
        expect(Object.keys(cache.entries ?? {})).toEqual([`diff --cached --shortstat|${root}`]);
    });

    it('keeps persistent entries for different cwd values in the same repository', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        const home = useTempHome();
        const { root } = createGitRepo();
        const subdir = path.join(root, 'subdir');
        fs.mkdirSync(subdir);
        mockExecFileSync.mockReturnValueOnce('root-branch\n');
        mockExecFileSync.mockReturnValueOnce('subdir-branch\n');

        expect(runGit('branch --show-current', { data: { cwd: root }, gitCacheTtlSeconds: 5 })).toBe('root-branch');
        expect(runGit('branch --show-current', { data: { cwd: subdir }, gitCacheTtlSeconds: 5 })).toBe('subdir-branch');

        const cache = readGitCacheJson(home);
        expect(Object.keys(cache.entries ?? {}).sort()).toEqual([
            `branch --show-current|${root}`,
            `branch --show-current|${subdir}`
        ]);
    });

    it('treats TTL 0 as cache disabled', () => {
        useTempHome();
        const { root } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 0 };
        mockExecFileSync.mockReturnValueOnce('first\n');
        mockExecFileSync.mockReturnValueOnce('second\n');

        expect(runGit('branch --show-current', context)).toBe('first');
        expect(runGit('branch --show-current', context)).toBe('second');

        expect(mockExecFileSync.mock.calls).toHaveLength(2);
    });

    it('expires persistent cache entries older than the configured TTL', () => {
        const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
        useTempHome();
        const { root } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 5 };
        mockExecFileSync.mockReturnValueOnce('old-value\n');

        expect(runGit('branch --show-current', context)).toBe('old-value');

        clearGitCache();
        nowSpy.mockReturnValue(7000);
        mockExecFileSync.mockReturnValueOnce('new-value\n');

        expect(runGit('branch --show-current', context)).toBe('new-value');
        expect(mockExecFileSync.mock.calls).toHaveLength(2);
    });

    it('invalidates cache entries when HEAD or index mtime changes', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        useTempHome();
        const {
            root,
            headPath,
            indexPath
        } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 60 };
        touch(headPath, 1000);
        touch(indexPath, 1000);
        mockExecFileSync.mockReturnValueOnce('old-value\n');

        expect(runGit('branch --show-current', context)).toBe('old-value');

        clearGitCache();
        touch(headPath, 2000);
        mockExecFileSync.mockReturnValueOnce('new-value\n');

        expect(runGit('branch --show-current', context)).toBe('new-value');
        expect(mockExecFileSync.mock.calls).toHaveLength(2);
    });

    it('invalidates cache entries when git config or the current branch ref changes', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        useTempHome();
        const {
            root,
            configPath,
            headRefPath
        } = createGitRepo();
        const context: RenderContext = { data: { cwd: root }, gitCacheTtlSeconds: 60 };
        touch(configPath, 1000);
        touch(headRefPath, 1000);
        mockExecFileSync.mockReturnValueOnce('old-value\n');

        expect(runGit('branch --show-current', context)).toBe('old-value');

        clearGitCache();
        touch(configPath, 2000);
        mockExecFileSync.mockReturnValueOnce('new-config-value\n');

        expect(runGit('branch --show-current', context)).toBe('new-config-value');

        clearGitCache();
        touch(headRefPath, 3000);
        mockExecFileSync.mockReturnValueOnce('new-ref-value\n');

        expect(runGit('branch --show-current', context)).toBe('new-ref-value');
        expect(mockExecFileSync.mock.calls).toHaveLength(3);
    });
});