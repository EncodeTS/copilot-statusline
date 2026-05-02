import {
    describe,
    expect,
    it
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import { stripSgrCodes } from '../ansi';
import {
    preRenderAllWidgets,
    renderStatusLine
} from '../renderer';

function renderPlain(widgets: WidgetItem[]): string {
    const context = { terminalWidth: 120 };
    const preRendered = preRenderAllWidgets([widgets], DEFAULT_SETTINGS, context)[0] ?? [];

    return stripSgrCodes(renderStatusLine(widgets, DEFAULT_SETTINGS, context, preRendered, []));
}

describe('renderStatusLine separators', () => {
    it('collapses separators around an empty widget between visible widgets', () => {
        const widgets: WidgetItem[] = [
            { id: 'a', type: 'custom-text', customText: 'A' },
            { id: 'sep-1', type: 'separator' },
            { id: 'empty', type: 'custom-text', customText: '' },
            { id: 'sep-2', type: 'separator' },
            { id: 'b', type: 'custom-text', customText: 'B' }
        ];

        expect(renderPlain(widgets)).toBe('A | B');
    });

    it('collapses separators around consecutive empty widgets', () => {
        const widgets: WidgetItem[] = [
            { id: 'a', type: 'custom-text', customText: 'A' },
            { id: 'sep-1', type: 'separator' },
            { id: 'empty-1', type: 'custom-text', customText: '' },
            { id: 'empty-2', type: 'custom-text', customText: '' },
            { id: 'sep-2', type: 'separator' },
            { id: 'b', type: 'custom-text', customText: 'B' }
        ];

        expect(renderPlain(widgets)).toBe('A | B');
    });
});