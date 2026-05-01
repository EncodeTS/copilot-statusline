import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import { formatTokens } from '../utils/format-tokens';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class RemainingTokensWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return 'Shows remaining tokens in current context (displayed_context_limit − current_context_tokens)'; }
    getDisplayName(): string { return 'Remaining Tokens'; }
    getCategory(): string { return 'Context'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Remaining: ', '164.8k');
        }

        const metrics = getContextWindowMetrics(context.data);
        const limit = metrics.displayedContextLimit ?? metrics.windowSize;
        if (limit !== null && metrics.currentContextTokens !== null) {
            const remaining = Math.max(0, limit - metrics.currentContextTokens);
            return formatRawOrLabeledValue(item, 'Remaining: ', formatTokens(remaining));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}