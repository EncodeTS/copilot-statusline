import { execFileSync } from 'child_process';
import {
    mkdtempSync,
    rmSync
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
import { GitBranchWidget } from '../GitBranch';

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

function createRepo(remoteUrl: string): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'copilot-statusline-git-branch-'));
    tempDirs.push(dir);
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['checkout', '-b', 'feature/demo'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['remote', 'add', 'origin', remoteUrl], { cwd: dir, stdio: 'ignore' });
    return dir;
}

afterEach(() => {
    clearGitCache();
    for (const dir of tempDirs.splice(0)) {
        rmSync(dir, { recursive: true, force: true });
    }
});

gitDescribe('GitBranchWidget', () => {
    it('links branches to GitLab-style remote web URLs', () => {
        const cwd = createRepo('git@gitlab.example.com:group/project.git');
        const widget = new GitBranchWidget();

        const output = widget.render(
            { id: '1', type: 'git-branch', metadata: { linkToRepo: 'true' } },
            { data: { cwd } },
            DEFAULT_SETTINGS
        );

        expect(output).toBe('\x1b]8;;https://gitlab.example.com/group/project/-/tree/feature/demo\x1b\\⎇ feature/demo\x1b]8;;\x1b\\');
    });

    it('reads legacy linkToGitHub metadata and toggles to linkToRepo', () => {
        const widget = new GitBranchWidget();
        const item = { id: '1', type: 'git-branch', metadata: { linkToGitHub: 'true' } };

        expect(widget.getEditorDisplay(item).modifierText).toContain('repo link');

        const updated = widget.handleEditorAction('toggle-link', item);

        expect(updated?.metadata).toBeUndefined();

        const toggledBackOn = updated ? widget.handleEditorAction('toggle-link', updated) : null;

        expect(toggledBackOn?.metadata).toEqual({ linkToRepo: 'true' });
    });
});