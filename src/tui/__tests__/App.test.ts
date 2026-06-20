import {
    describe,
    expect,
    it
} from 'vitest';

import {
    getConfirmCancelScreen,
    getInvalidConfigSaveWarning
} from '../App';

describe('App helpers', () => {
    it('defaults confirm cancellation to the main screen', () => {
        expect(getConfirmCancelScreen(null)).toBe('main');
    });

    it('builds an invalid-config overwrite warning with path and reason', () => {
        const warning = getInvalidConfigSaveWarning('/tmp/settings.json', 'settings.json is not valid JSON');

        expect(warning).toContain('/tmp/settings.json');
        expect(warning).toContain('settings.json is not valid JSON');
        expect(warning).toContain('overwrite');
    });
});