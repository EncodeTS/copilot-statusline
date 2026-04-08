interface ModelContextConfig {
    maxTokens: number;
    usableTokens: number;
}

const DEFAULT_CONTEXT_WINDOW_SIZE = 200000;
const USABLE_CONTEXT_RATIO = 0.8;

function toValidWindowSize(value: number | null | undefined): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return null;
    }

    return value;
}

export function getContextConfig(contextWindowSize?: number | null): ModelContextConfig {
    const statusWindowSize = toValidWindowSize(contextWindowSize);
    if (statusWindowSize !== null) {
        return {
            maxTokens: statusWindowSize,
            usableTokens: Math.floor(statusWindowSize * USABLE_CONTEXT_RATIO)
        };
    }

    return {
        maxTokens: DEFAULT_CONTEXT_WINDOW_SIZE,
        usableTokens: Math.floor(DEFAULT_CONTEXT_WINDOW_SIZE * USABLE_CONTEXT_RATIO)
    };
}