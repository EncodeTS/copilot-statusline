import { execFileSync } from 'child_process';
import {
    mkdtempSync,
    rmSync,
    writeFileSync
} from 'fs';
import os from 'os';
import path from 'path';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../types/Settings';
import { clearGitCache } from '../../utils/git';
import { GitCleanStatusWidget } from '../GitCleanStatus';
import { GitStagedFilesWidget } from '../GitStagedFiles';
import { GitUnstagedFilesWidget } from '../GitUnstagedFiles';
import { GitUntrackedFilesWidget } from '../GitUntrackedFiles';

const tempDirs: string[] = [];
const gitDescribe = isGitAvailable() ? describe : describe.skip;

function isGitAvailable(): boolean {
    try {
        execFileSync('git', ['--version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function git(cwd: string, args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function createRepo(): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'copilot-statusline-git-file-status-'));
    tempDirs.push(dir);
    git(dir, ['init']);
    git(dir, ['config', 'user.email', 'test@example.com']);
    git(dir, ['config', 'user.name', 'Test User']);
    writeFileSync(path.join(dir, 'tracked.txt'), 'initial\n');
    git(dir, ['add', 'tracked.txt']);
    git(dir, ['commit', '-m', 'initial']);
    return dir;
}

afterEach(() => {
    clearGitCache();
    for (const dir of tempDirs.splice(0)) {
        rmSync(dir, { recursive: true, force: true });
    }
});

gitDescribe('git file status widgets', () => {
    it('renders staged, unstaged, untracked, and dirty counts for a repository', () => {
        const cwd = createRepo();
        writeFileSync(path.join(cwd, 'tracked.txt'), 'modified\n');
        writeFileSync(path.join(cwd, 'staged.txt'), 'staged\n');
        git(cwd, ['add', 'staged.txt']);
        writeFileSync(path.join(cwd, 'untracked.txt'), 'untracked\n');

        expect(new GitStagedFilesWidget().render({ id: '1', type: 'git-staged-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('S:1');
        expect(new GitUnstagedFilesWidget().render({ id: '2', type: 'git-unstaged-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('M:1');
        expect(new GitUntrackedFilesWidget().render({ id: '3', type: 'git-untracked-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('?:1');
        expect(new GitCleanStatusWidget().render({ id: '4', type: 'git-clean-status' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('✗');
    });

    it('renders zero counts and clean status for a clean repository', () => {
        const cwd = createRepo();

        expect(new GitStagedFilesWidget().render({ id: '1', type: 'git-staged-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('S:0');
        expect(new GitUnstagedFilesWidget().render({ id: '2', type: 'git-unstaged-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('M:0');
        expect(new GitUntrackedFilesWidget().render({ id: '3', type: 'git-untracked-files' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('?:0');
        expect(new GitCleanStatusWidget().render({ id: '4', type: 'git-clean-status' }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('✓');
    });

    it('supports raw values', () => {
        const cwd = createRepo();
        writeFileSync(path.join(cwd, 'staged.txt'), 'staged\n');
        git(cwd, ['add', 'staged.txt']);

        expect(new GitStagedFilesWidget().render({ id: '1', type: 'git-staged-files', rawValue: true }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('1');
        expect(new GitCleanStatusWidget().render({ id: '4', type: 'git-clean-status', rawValue: true }, { data: { cwd } }, DEFAULT_SETTINGS)).toBe('dirty');
    });
});