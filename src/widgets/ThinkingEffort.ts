import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    normalizeThinkingEffort,
    parseDisplayName,
    trustThinkingEffort
} from '../utils/display-name-parser';

export class ThinkingEffortWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return 'Displays the thinking effort level from the Copilot model payload'; }
    getDisplayName(): string { return 'Thinking Effort'; }
    getCategory(): string { return 'Core'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'high' : 'Thinking: high';
        }

        const model = context.data?.model;
        const thinkingEffort = trustThinkingEffort(model?.thinking_effort_level)
            ?? normalizeThinkingEffort(model?.thinking_effort)
            ?? normalizeThinkingEffort(model?.reasoning_effort)
            ?? parseDisplayName(model?.display_name).thinkingEffort;
        if (thinkingEffort) {
            return item.rawValue ? thinkingEffort : `Thinking: ${thinkingEffort}`;
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}