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

export class PremiumRequestsWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows total premium requests consumed this session'; }
    getDisplayName(): string { return 'Premium Requests'; }
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
            return formatRawOrLabeledValue(item, 'Reqs: ', '15');
        }

        const requests = context.data?.cost?.total_premium_requests;
        if (typeof requests === 'number') {
            if (requests === 0 && isHideWhenZeroEnabled(item)) {
                return null;
            }
            return formatRawOrLabeledValue(item, 'Reqs: ', String(requests));
        }
        return null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return getHideWhenZeroKeybinds();
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }

    getNumericValue(context: RenderContext): number | null {
        return context.data?.cost?.total_premium_requests ?? null;
    }
}