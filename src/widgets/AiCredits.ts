import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { makeModifierText } from './shared/editor-display';
import {
    getHideWhenZeroKeybinds,
    getHideWhenZeroLabel,
    handleToggleHideWhenZeroAction,
    isHideWhenZeroEnabled
} from './shared/hide-when-zero';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const NANO_AI_CREDITS_PER_AI_CREDIT = 1_000_000_000;
const AI_CREDITS_LABEL = 'AIC: ';

function formatAiCreditsFromNano(totalNanoAiu: number): string {
    const credits = totalNanoAiu / NANO_AI_CREDITS_PER_AI_CREDIT;

    if (credits === 0) {
        return '0';
    }

    if (credits >= 10) {
        return credits.toFixed(1).replace(/\.0$/, '');
    }

    if (credits >= 1) {
        return credits.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    }

    return credits.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function getAiCreditsValue(context: RenderContext): { formatted: string; numeric: number } | null {
    const aiUsed = context.data?.ai_used;
    const formatted = aiUsed?.formatted;
    const totalNanoAiu = aiUsed?.total_nano_aiu;

    if (typeof formatted === 'string' && formatted.trim() !== '') {
        const numeric = typeof totalNanoAiu === 'number' && Number.isFinite(totalNanoAiu)
            ? Math.max(0, totalNanoAiu) / NANO_AI_CREDITS_PER_AI_CREDIT
            : Number.parseFloat(formatted.replace(/,/g, ''));

        return {
            formatted,
            numeric: Number.isFinite(numeric) ? Math.max(0, numeric) : 0
        };
    }

    if (typeof totalNanoAiu === 'number' && Number.isFinite(totalNanoAiu)) {
        const clampedNanoAiu = Math.max(0, totalNanoAiu);
        return {
            formatted: formatAiCreditsFromNano(clampedNanoAiu),
            numeric: clampedNanoAiu / NANO_AI_CREDITS_PER_AI_CREDIT
        };
    }

    return null;
}

export class AiCreditsWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows GitHub AI Credits (AIC) used this session'; }
    getDisplayName(): string { return 'AI Credits'; }
    getCategory(): string { return 'Session'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: makeModifierText([getHideWhenZeroLabel(item)].filter((label): label is string => label !== undefined))
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleToggleHideWhenZeroAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, AI_CREDITS_LABEL, '12.8');
        }

        const value = getAiCreditsValue(context);
        if (!value) {
            return null;
        }

        if (value.numeric === 0 && isHideWhenZeroEnabled(item)) {
            return null;
        }

        return formatRawOrLabeledValue(item, AI_CREDITS_LABEL, value.formatted);
    }

    getCustomKeybinds(): CustomKeybind[] {
        return getHideWhenZeroKeybinds();
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }

    getNumericValue(context: RenderContext): number | null {
        return getAiCreditsValue(context)?.numeric ?? null;
    }
}