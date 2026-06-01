import type { CopilotPayload } from '../types/CopilotPayload';

export interface ContextWindowMetrics {
    windowSize: number | null;
    displayedContextLimit: number | null;
    currentContextTokens: number | null;
    currentContextUsedPercentage: number | null;
    totalInputTokens: number | null;
    nonCachedInputTokens: number | null;
    totalOutputTokens: number | null;
    cachedTokens: number | null;
    totalTokens: number | null;
    reasoningTokens: number | null;
    lastCallInputTokens: number | null;
    lastCallOutputTokens: number | null;
    cacheReadTokens: number | null;
    cacheWriteTokens: number | null;
}

function toFiniteNonNegativeNumber(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    return Math.max(0, value);
}

function clampPercentage(value: number): number {
    return Math.max(0, Math.min(100, value));
}

export function getContextWindowMetrics(data?: CopilotPayload): ContextWindowMetrics {
    const contextWindow = data?.context_window;

    const empty: ContextWindowMetrics = {
        windowSize: null,
        displayedContextLimit: null,
        currentContextTokens: null,
        currentContextUsedPercentage: null,
        totalInputTokens: null,
        nonCachedInputTokens: null,
        totalOutputTokens: null,
        cachedTokens: null,
        totalTokens: null,
        reasoningTokens: null,
        lastCallInputTokens: null,
        lastCallOutputTokens: null,
        cacheReadTokens: null,
        cacheWriteTokens: null
    };

    if (!contextWindow) {
        return empty;
    }

    const rawWindowSize = toFiniteNonNegativeNumber(contextWindow.context_window_size);
    const windowSize = rawWindowSize !== null && rawWindowSize > 0 ? rawWindowSize : null;
    const rawDisplayedLimit = toFiniteNonNegativeNumber(contextWindow.displayed_context_limit);
    const displayedContextLimit = rawDisplayedLimit !== null && rawDisplayedLimit > 0 ? rawDisplayedLimit : null;
    const currentContextTokens = toFiniteNonNegativeNumber(contextWindow.current_context_tokens);
    const rawCurrentPct = toFiniteNonNegativeNumber(contextWindow.current_context_used_percentage);
    const currentContextUsedPercentage = rawCurrentPct !== null ? clampPercentage(rawCurrentPct) : null;
    const reasoningTokens = toFiniteNonNegativeNumber(contextWindow.total_reasoning_tokens);
    const totalInputTokens = toFiniteNonNegativeNumber(contextWindow.total_input_tokens);
    const totalOutputTokens = toFiniteNonNegativeNumber(contextWindow.total_output_tokens);
    const cacheReadTokens = toFiniteNonNegativeNumber(contextWindow.total_cache_read_tokens);
    const cacheWriteTokens = toFiniteNonNegativeNumber(contextWindow.total_cache_write_tokens);
    const lastCallInputTokens = toFiniteNonNegativeNumber(contextWindow.last_call_input_tokens);
    const lastCallOutputTokens = toFiniteNonNegativeNumber(contextWindow.last_call_output_tokens);

    // Copilot reports cache read/write as sub-buckets of total_input_tokens.
    // Expose upstream ccstatusline-style non-overlapping buckets:
    // billable input + cached input + output.
    const cachedTokens = cacheReadTokens !== null || cacheWriteTokens !== null
        ? (cacheReadTokens ?? 0) + (cacheWriteTokens ?? 0)
        : null;
    const nonCachedInputTokens = totalInputTokens !== null
        ? Math.max(0, totalInputTokens - (cachedTokens ?? 0))
        : null;

    const totalTokens = toFiniteNonNegativeNumber(contextWindow.total_tokens)
        ?? (totalInputTokens !== null && totalOutputTokens !== null
            ? totalInputTokens + totalOutputTokens
            : null);

    return {
        windowSize,
        displayedContextLimit,
        currentContextTokens,
        currentContextUsedPercentage,
        totalInputTokens,
        nonCachedInputTokens,
        totalOutputTokens,
        cachedTokens,
        totalTokens,
        reasoningTokens,
        lastCallInputTokens,
        lastCallOutputTokens,
        cacheReadTokens,
        cacheWriteTokens
    };
}

export function getContextWindowInputTotalTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).nonCachedInputTokens;
}

export function getContextWindowOutputTotalTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).totalOutputTokens;
}

export function getContextWindowCachedTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).cachedTokens;
}

export function getContextWindowTotalTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).totalTokens;
}

export function getContextWindowSize(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).windowSize;
}