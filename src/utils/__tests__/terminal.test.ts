import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    canDetectTerminalWidth,
    getTerminalWidth
} from '../terminal';

const originalCopilotWidth = process.env.COPILOT_STATUSLINE_WIDTH;
const originalCcstatuslineWidth = process.env.CCSTATUSLINE_WIDTH;

function restoreEnv(): void {
    if (originalCopilotWidth === undefined) {
        delete process.env.COPILOT_STATUSLINE_WIDTH;
    } else {
        process.env.COPILOT_STATUSLINE_WIDTH = originalCopilotWidth;
    }

    if (originalCcstatuslineWidth === undefined) {
        delete process.env.CCSTATUSLINE_WIDTH;
    } else {
        process.env.CCSTATUSLINE_WIDTH = originalCcstatuslineWidth;
    }
}

describe('terminal width detection', () => {
    afterEach(() => {
        restoreEnv();
    });

    it('uses COPILOT_STATUSLINE_WIDTH as an explicit override', () => {
        process.env.COPILOT_STATUSLINE_WIDTH = '142';
        delete process.env.CCSTATUSLINE_WIDTH;

        expect(getTerminalWidth()).toBe(142);
        expect(canDetectTerminalWidth()).toBe(true);
    });

    it('falls back to CCSTATUSLINE_WIDTH for shared statusline setups', () => {
        delete process.env.COPILOT_STATUSLINE_WIDTH;
        process.env.CCSTATUSLINE_WIDTH = '99';

        expect(getTerminalWidth()).toBe(99);
    });

    it('ignores an invalid primary override and uses a valid fallback', () => {
        process.env.COPILOT_STATUSLINE_WIDTH = 'wide';
        process.env.CCSTATUSLINE_WIDTH = '120';

        expect(getTerminalWidth()).toBe(120);
    });
});