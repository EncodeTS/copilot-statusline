import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class PremiumRateWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Shows premium requests consumed per minute (burn rate)'; }
    getDisplayName(): string { return 'Premium Rate'; }
    getCategory(): string { return 'Session'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Rate: ', '2.5/min');
        }

        const requests = context.data?.cost?.total_premium_requests;
        const durationMs = context.data?.cost?.total_duration_ms;

        if (typeof requests !== 'number' || typeof durationMs !== 'number' || durationMs <= 0) {
            return null;
        }

        const minutes = durationMs / 60000;
        if (minutes < 0.001) {
            return null;
        }

        const rate = requests / minutes;
        const formatted = rate < 10 ? rate.toFixed(1) : Math.round(rate).toString();
        return formatRawOrLabeledValue(item, 'Rate: ', `${formatted}/min`);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}