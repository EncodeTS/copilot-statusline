import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { parseDisplayName } from '../utils/display-name-parser';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class ApiCallsWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows estimated actual API calls (premium_requests / multiplier)'; }
    getDisplayName(): string { return 'API Calls'; }
    getCategory(): string { return 'Session'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, 'Calls: ', '5');
        }

        const requests = context.data?.cost?.total_premium_requests;
        if (typeof requests !== 'number') {
            return null;
        }

        const parsed = parseDisplayName(context.data?.model?.display_name);
        if (parsed.multiplierValue && parsed.multiplierValue > 0) {
            const apiCalls = Math.round(requests / parsed.multiplierValue);
            return formatRawOrLabeledValue(item, 'Calls: ', String(apiCalls));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}