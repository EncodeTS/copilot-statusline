import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { parseDisplayName } from '../utils/display-name-parser';

export class ModelMultiplierWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Shows the per-request premium multiplier parsed from model.display_name (e.g. 3x)'; }
    getDisplayName(): string { return 'Model Multiplier'; }
    getCategory(): string { return 'Core'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '3x' : 'Multiplier: 3x';
        }

        const parsed = parseDisplayName(context.data?.model?.display_name);
        if (parsed.multiplier) {
            return item.rawValue ? parsed.multiplier : `Multiplier: ${parsed.multiplier}`;
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}