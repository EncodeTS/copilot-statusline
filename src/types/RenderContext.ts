import type { CopilotPayload } from './CopilotPayload';

export interface RenderContext {
    data?: CopilotPayload;
    terminalWidth?: number | null;
    isPreview?: boolean;
    minimalist?: boolean;
    lineIndex?: number;
    globalSeparatorIndex?: number;
    globalPowerlineThemeIndex?: number;

    // For git widget thresholds
    gitData?: {
        changedFiles?: number;
        insertions?: number;
        deletions?: number;
    };
}