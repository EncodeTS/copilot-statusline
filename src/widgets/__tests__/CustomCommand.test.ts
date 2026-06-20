import type { ExecSyncOptions } from 'node:child_process';
import * as childProcess from 'node:child_process';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../types/Settings';
import { createRuntimeRenderContext } from '../../utils/render-context';
import { CustomCommandWidget } from '../CustomCommand';

let execSyncSpy: {
    mockClear: () => void;
    mockRestore: () => void;
};

const ORIGINAL_COPILOT_STATUSLINE_WIDTH = process.env.COPILOT_STATUSLINE_WIDTH;

describe('CustomCommandWidget', () => {
    beforeEach(() => {
        execSyncSpy = vi.spyOn(childProcess, 'execSync')
            .mockImplementation((_command: string, options?: ExecSyncOptions) => (
                typeof options?.input === 'string' ? options.input : ''
            )) as unknown as typeof execSyncSpy;
    });

    afterEach(() => {
        execSyncSpy.mockRestore();
        if (ORIGINAL_COPILOT_STATUSLINE_WIDTH === undefined) {
            delete process.env.COPILOT_STATUSLINE_WIDTH;
        } else {
            process.env.COPILOT_STATUSLINE_WIDTH = ORIGINAL_COPILOT_STATUSLINE_WIDTH;
        }
    });

    it('passes terminal_width to custom commands when terminal width is known', () => {
        const widget = new CustomCommandWidget();
        const output = widget.render(
            { id: 'cmd', type: 'custom-command', commandPath: 'node custom.js' },
            { data: { version: '1.0.64-1' }, terminalWidth: 123 },
            DEFAULT_SETTINGS
        );

        expect(JSON.parse(output ?? '{}')).toEqual({
            version: '1.0.64-1',
            terminal_width: 123
        });
        expect(childProcess.execSync).toHaveBeenCalledWith(
            'node custom.js',
            expect.objectContaining({
                timeout: 1000,
                windowsHide: true
            })
        );
    });

    it('does not add terminal_width when terminal width is unavailable', () => {
        const widget = new CustomCommandWidget();
        const output = widget.render(
            { id: 'cmd', type: 'custom-command', commandPath: 'node custom.js' },
            { data: { version: '1.0.64-1' } },
            DEFAULT_SETTINGS
        );

        expect(JSON.parse(output ?? '{}')).toEqual({ version: '1.0.64-1' });
    });

    it('gets terminal_width from the runtime render context before custom command pre-rendering', () => {
        process.env.COPILOT_STATUSLINE_WIDTH = '123';
        const widget = new CustomCommandWidget();
        const context = createRuntimeRenderContext({ version: '1.0.64-1' }, DEFAULT_SETTINGS);

        const output = widget.render(
            { id: 'cmd', type: 'custom-command', commandPath: 'node custom.js' },
            context,
            DEFAULT_SETTINGS
        );

        expect(JSON.parse(output ?? '{}')).toEqual({
            version: '1.0.64-1',
            terminal_width: 123
        });
    });
});