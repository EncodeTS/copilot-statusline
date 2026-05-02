import type {
    CustomKeybind,
    WidgetItem
} from '../../types/Widget';

export type ContextSliderMode = 'none' | 'slider' | 'slider-only';

const SLIDER_WIDTH = 10;
const SLIDER_TOGGLE_KEYBIND: CustomKeybind = { key: 'p', label: '(p)rogress toggle', action: 'toggle-slider' };

function makeSliderBar(percent: number, width = SLIDER_WIDTH): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round((clamped / 100) * width);

    return '▓'.repeat(filled) + '░'.repeat(width - filled);
}

export function getContextSliderMode(item: WidgetItem): ContextSliderMode {
    const mode = item.metadata?.display;
    if (mode === 'slider' || mode === 'slider-only') {
        return mode;
    }
    return 'none';
}

export function cycleContextSliderMode(item: WidgetItem): WidgetItem {
    const currentMode = getContextSliderMode(item);
    const nextMode: ContextSliderMode = currentMode === 'none'
        ? 'slider'
        : currentMode === 'slider'
            ? 'slider-only'
            : 'none';

    if (nextMode === 'none') {
        const nextMetadata = { ...(item.metadata ?? {}) };
        delete nextMetadata.display;

        return {
            ...item,
            metadata: Object.keys(nextMetadata).length > 0 ? nextMetadata : undefined
        };
    }

    return {
        ...item,
        metadata: {
            ...(item.metadata ?? {}),
            display: nextMode
        }
    };
}

export function renderContextSlider(mode: ContextSliderMode, percent: number): string | null {
    if (mode === 'none') {
        return null;
    }

    const slider = makeSliderBar(percent);
    if (mode === 'slider') {
        return `${slider} ${percent.toFixed(1)}%`;
    }
    return slider;
}

export function getContextSliderLabel(item: WidgetItem): string | undefined {
    const mode = getContextSliderMode(item);
    if (mode === 'slider') {
        return 'short bar';
    }
    if (mode === 'slider-only') {
        return 'short bar only';
    }
    return undefined;
}

export function getContextSliderModifierText(item: WidgetItem): string | undefined {
    const label = getContextSliderLabel(item);
    return label ? `(${label})` : undefined;
}

export function getContextSliderKeybinds(): CustomKeybind[] {
    return [SLIDER_TOGGLE_KEYBIND];
}