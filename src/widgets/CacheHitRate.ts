import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class CacheHitRateWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows cache reads as a share of reported cache reads plus writes, not total input'; }
    getDisplayName(): string { return 'Cache Hit Rate'; }
    getCategory(): string { return 'Tokens'; }
    getEditorDisplay(_item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Cache Hit: ', '87.0%');
        }

        const metrics = getContextWindowMetrics(context.data);
        const cacheRead = metrics.cacheReadTokens;
        const cacheWrite = metrics.cacheWriteTokens;
        if (cacheRead === null && cacheWrite === null) {
            return null;
        }

        const denominator = (cacheRead ?? 0) + (cacheWrite ?? 0);
        if (denominator <= 0) {
            return null;
        }

        const percentage = ((cacheRead ?? 0) / denominator) * 100;
        return formatRawOrLabeledValue(item, 'Cache Hit: ', `${percentage.toFixed(1)}%`);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}