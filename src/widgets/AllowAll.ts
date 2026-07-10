import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class AllowAllWidget implements Widget {
    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return 'Shows YOLO when Copilot allow-all mode is enabled'; }
    getDisplayName(): string { return 'Allow All'; }
    getCategory(): string { return 'Core'; }
    getEditorDisplay(_item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'on' : 'YOLO';
        }

        if (context.data?.allow_all_enabled !== true) {
            return null;
        }

        return item.rawValue ? 'on' : 'YOLO';
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}