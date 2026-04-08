import type { RenderContext } from '../types';

import { getContextWindowMetrics } from './context-window';

export function calculateContextPercentage(context: RenderContext): number {
    const contextWindowMetrics = getContextWindowMetrics(context.data);
    if (contextWindowMetrics.usedPercentage !== null) {
        return contextWindowMetrics.usedPercentage;
    }

    return 0;
}