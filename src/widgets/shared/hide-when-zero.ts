import type {
    CustomKeybind,
    WidgetItem
} from '../../types/Widget';

import {
    isMetadataFlagEnabled,
    toggleMetadataFlag
} from './metadata';

const HIDE_WHEN_ZERO_KEY = 'hideWhenZero';
const TOGGLE_HIDE_WHEN_ZERO_ACTION = 'toggle-hide-when-zero';

const HIDE_WHEN_ZERO_KEYBIND: CustomKeybind = {
    key: 'z',
    label: '(z) hide when zero',
    action: TOGGLE_HIDE_WHEN_ZERO_ACTION
};

export function isHideWhenZeroEnabled(item: WidgetItem): boolean {
    return isMetadataFlagEnabled(item, HIDE_WHEN_ZERO_KEY);
}

export function getHideWhenZeroLabel(item: WidgetItem): string | undefined {
    return isHideWhenZeroEnabled(item) ? 'hide when zero' : undefined;
}

export function handleToggleHideWhenZeroAction(action: string, item: WidgetItem): WidgetItem | null {
    if (action !== TOGGLE_HIDE_WHEN_ZERO_ACTION) {
        return null;
    }

    return toggleMetadataFlag(item, HIDE_WHEN_ZERO_KEY);
}

export function getHideWhenZeroKeybinds(): CustomKeybind[] {
    return [HIDE_WHEN_ZERO_KEYBIND];
}