import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class PremiumRequestsWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows total premium requests consumed this session'; }
    getDisplayName(): string { return 'Premium Requests'; }
    getCategory(): string { return 'Session'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Reqs: ', '15');
        }

        const requests = context.data?.cost?.total_premium_requests;
        if (typeof requests === 'number') {
            return formatRawOrLabeledValue(item, 'Reqs: ', String(requests));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }

    getNumericValue(context: RenderContext): number | null {
        return context.data?.cost?.total_premium_requests ?? null;
    }
}