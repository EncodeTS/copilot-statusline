import {
    describe,
    expect,
    it
} from 'vitest';

import type { WidgetItem } from '../../../types/Widget';
import {
    cycleContextSliderMode,
    getContextSliderMode
} from '../context-slider';

function widget(metadata?: Record<string, string>): WidgetItem {
    return { id: '1', type: 'context-percentage', ...(metadata ? { metadata } : {}) };
}

describe('cycleContextSliderMode', () => {
    it('cycles none → slider → slider-only → none', () => {
        const startNone = widget();
        const slider = cycleContextSliderMode(startNone);
        expect(getContextSliderMode(slider)).toBe('slider');
        expect(slider.metadata?.display).toBe('slider');

        const sliderOnly = cycleContextSliderMode(slider);
        expect(getContextSliderMode(sliderOnly)).toBe('slider-only');
        expect(sliderOnly.metadata?.display).toBe('slider-only');

        const back = cycleContextSliderMode(sliderOnly);
        expect(getContextSliderMode(back)).toBe('none');
    });

    it('clears metadata.display when cycling back to none, preserving other metadata', () => {
        const sliderOnly = widget({ display: 'slider-only', inverse: 'true' });

        const back = cycleContextSliderMode(sliderOnly);

        expect(back.metadata).toEqual({ inverse: 'true' });
    });

    it('drops metadata entirely when cycling to none with no other keys', () => {
        const sliderOnly = widget({ display: 'slider-only' });

        const back = cycleContextSliderMode(sliderOnly);

        expect(back.metadata).toBeUndefined();
    });
});