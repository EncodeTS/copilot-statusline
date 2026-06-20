// Format a token count with `decimals` places in the "k" range. Once the k
// value would round up to "1000" at that precision, promote to "1.0M" instead.
export function formatTokens(count: number, decimals = 1): string {
    if (count >= 1000000 - 500 / 10 ** decimals)
        return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000)
        return `${(count / 1000).toFixed(decimals)}k`;
    return count.toString();
}