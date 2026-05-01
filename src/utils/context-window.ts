import type { CopilotPayload } from '../types/CopilotPayload';

export interface ContextWindowMetrics {
    windowSize: number | null;
    displayedContextLimit: number | null;
    usedTokens: number | null;
    contextLengthTokens: number | null;
    currentContextTokens: number | null;
    currentContextUsedPercentage: number | null;
    usedPercentage: number | null;
    remainingPercentage: number | null;
    totalInputTokens: number | null;
    totalOutputTokens: number | null;
    cachedTokens: number | null;
    totalTokens: number | null;
    reasoningTokens: number | null;
    remainingTokens: number | null;
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
        usedTokens: null,
        contextLengthTokens: null,
        currentContextTokens: null,
        currentContextUsedPercentage: null,
        usedPercentage: null,
        remainingPercentage: null,
        totalInputTokens: null,
        totalOutputTokens: null,
        cachedTokens: null,
        totalTokens: null,
        reasoningTokens: null,
        remainingTokens: null,
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
    const remainingTokens = toFiniteNonNegativeNumber(contextWindow.remaining_tokens);
    const lastCallInputTokens = toFiniteNonNegativeNumber(contextWindow.last_call_input_tokens);
    const lastCallOutputTokens = toFiniteNonNegativeNumber(contextWindow.last_call_output_tokens);

    const cachedTokens = cacheReadTokens !== null || cacheWriteTokens !== null
        ? (cacheReadTokens ?? 0) + (cacheWriteTokens ?? 0)
        : null;

    let currentUsageTotalTokens: number | null = null;
    let contextLengthTokens: number | null = null;

    if (contextWindow.current_usage && typeof contextWindow.current_usage === 'object') {
        const usage = contextWindow.current_usage;
        const inputTokens = toFiniteNonNegativeNumber(usage.input_tokens) ?? 0;
        const outputTokens = toFiniteNonNegativeNumber(usage.output_tokens) ?? 0;
        const cacheCreationTokens = toFiniteNonNegativeNumber(usage.cache_creation_input_tokens) ?? 0;
        const cacheReadInputTokens = toFiniteNonNegativeNumber(usage.cache_read_input_tokens) ?? 0;

        currentUsageTotalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadInputTokens;
        contextLengthTokens = inputTokens + cacheCreationTokens + cacheReadInputTokens;
    }

    const rawUsedPercentage = toFiniteNonNegativeNumber(contextWindow.used_percentage);
    const rawRemainingPercentage = toFiniteNonNegativeNumber(contextWindow.remaining_percentage);

    // Derive usedTokens from authoritative sources first:
    // 1. remaining_tokens (most accurate — direct from API)
    // 2. used_percentage * windowSize
    // 3. current_usage sums (last resort — these are cumulative across all calls,
    //    so they can exceed the window size when caching is heavy)
    const usedTokensFromRemaining = windowSize !== null && remainingTokens !== null
        ? windowSize - remainingTokens
        : null;
    const usedTokensFromPercentage = rawUsedPercentage !== null && windowSize !== null
        ? (rawUsedPercentage / 100) * windowSize
        : null;

    const usedTokens = usedTokensFromRemaining ?? usedTokensFromPercentage ?? currentUsageTotalTokens;

    const usedPercentage = rawUsedPercentage !== null
        ? clampPercentage(rawUsedPercentage)
        : usedTokens !== null && windowSize !== null && windowSize > 0
            ? clampPercentage((usedTokens / windowSize) * 100)
            : null;

    const remainingPercentage = rawRemainingPercentage !== null
        ? clampPercentage(rawRemainingPercentage)
        : usedPercentage !== null
            ? 100 - usedPercentage
            : null;

    const totalTokens = currentUsageTotalTokens
        ?? toFiniteNonNegativeNumber(contextWindow.total_tokens)
        ?? (totalInputTokens !== null && totalOutputTokens !== null
            ? totalInputTokens + totalOutputTokens
            : null);

    // contextLengthTokens: use the same authoritative sources as usedTokens.
    // Only fall back to input-only current_usage sum if no better source exists.
    const contextLengthFromAuthoritative = usedTokensFromRemaining ?? usedTokensFromPercentage;

    return {
        windowSize,
        displayedContextLimit,
        usedTokens,
        contextLengthTokens: contextLengthFromAuthoritative ?? contextLengthTokens ?? usedTokens,
        currentContextTokens,
        currentContextUsedPercentage,
        usedPercentage,
        remainingPercentage,
        totalInputTokens,
        totalOutputTokens,
        cachedTokens,
        totalTokens,
        reasoningTokens,
        remainingTokens,
        lastCallInputTokens,
        lastCallOutputTokens,
        cacheReadTokens,
        cacheWriteTokens
    };
}

export function getContextWindowInputTotalTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).totalInputTokens;
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

export function getContextWindowUsedPercentage(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).usedPercentage;
}

export function getContextWindowRemainingTokens(data?: CopilotPayload): number | null {
    return getContextWindowMetrics(data).remainingTokens;
}