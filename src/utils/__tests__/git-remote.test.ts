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
    it('builds branch URLs from remote info', () => {
        const remote: RemoteInfo = {
            name: 'origin',
            url: 'git@gitlab.example.com:group/project.git',
            host: 'gitlab.example.com',
            owner: 'group',
            repo: 'project'
        };

        expect(buildBranchWebUrl(remote, 'feature/demo')).toBe('https://gitlab.example.com/group/project/tree/feature/demo');
    });
});