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

export class ContextWindowWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return 'Shows the model\'s context window size (max tokens)'; }
    getDisplayName(): string { return 'Context Window'; }
    getCategory(): string { return 'Context'; }
    getEditorDisplay(_item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Window: ', '1000k');
        }

        const metrics = getContextWindowMetrics(context.data);
        const size = metrics.displayedContextLimit ?? metrics.windowSize;
        if (size !== null) {
            return formatRawOrLabeledValue(item, 'Window: ', formatTokens(size));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}