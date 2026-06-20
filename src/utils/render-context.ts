import type { CopilotPayload } from '../types/CopilotPayload';
import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';

import { getTerminalWidth } from './terminal';

export function createRuntimeRenderContext(data: CopilotPayload, settings: Settings): RenderContext {
    const terminalWidth = getTerminalWidth();

    return {
        data,
        isPreview: false,
        minimalist: settings.minimalistMode,
        gitCacheTtlSeconds: settings.gitCacheTtlSeconds,
        ...(terminalWidth !== null ? { terminalWidth } : {})
    };
}