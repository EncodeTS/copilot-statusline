import {
    describe,
    expect,
    it
} from 'vitest';

import {
    buildBranchWebUrl,
    type RemoteInfo
} from '../git-remote';

describe('git-remote', () => {
    it('builds GitLab branch URLs from remote info', () => {
        const remote: RemoteInfo = {
            name: 'origin',
            url: 'git@gitlab.example.com:group/project.git',
            host: 'gitlab.example.com',
            owner: 'group',
            repo: 'project'
        };

        expect(buildBranchWebUrl(remote, 'feature/demo')).toBe('https://gitlab.example.com/group/project/-/tree/feature/demo');
    });

    it('preserves explicit ports in HTTP remote URLs', () => {
        const remote: RemoteInfo = {
            name: 'origin',
            url: 'https://git.example.com:8443/org/repo.git',
            host: 'git.example.com',
            owner: 'org',
            repo: 'repo'
        };

        expect(buildBranchWebUrl(remote, 'main')).toBe('https://git.example.com:8443/org/repo/tree/main');
    });
});