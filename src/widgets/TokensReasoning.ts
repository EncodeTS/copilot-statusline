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

export class TokensReasoningWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return 'Shows total reasoning (thinking) tokens consumed this session'; }
    getDisplayName(): string { return 'Tokens Reasoning'; }
    getCategory(): string { return 'Tokens'; }
    getEditorDisplay(_item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Reasoning: ', '1.2k');
        }

        const metrics = getContextWindowMetrics(context.data);
        if (metrics.reasoningTokens !== null) {
            return formatRawOrLabeledValue(item, 'Reasoning: ', formatTokens(metrics.reasoningTokens));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}