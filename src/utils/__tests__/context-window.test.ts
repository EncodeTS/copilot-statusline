import {
    describe,
    expect,
    it
} from 'vitest';

import type { CopilotPayload } from '../../types/CopilotPayload';
import { getContextWindowMetrics } from '../context-window';

describe('getContextWindowMetrics', () => {
    it('returns nulls for undefined data', () => {
        const result = getContextWindowMetrics(undefined);
        expect(result.windowSize).toBeNull();
        expect(result.usedPercentage).toBeNull();
        expect(result.totalInputTokens).toBeNull();
    });

    it('returns nulls for empty context_window', () => {
        const result = getContextWindowMetrics({});
        expect(result.windowSize).toBeNull();
        expect(result.totalTokens).toBeNull();
    });

    it('parses a startup payload with all nulls', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: null,
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 0,
                used_percentage: null,
                remaining_percentage: null,
                remaining_tokens: null,
                last_call_input_tokens: 0,
                last_call_output_tokens: 0
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBeNull();
        expect(result.usedPercentage).toBeNull();
        expect(result.totalInputTokens).toBe(0);
    });

    it('parses a model-ready payload', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 200000,
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 0,
                used_percentage: 0,
                remaining_percentage: 100,
                remaining_tokens: 200000,
                last_call_input_tokens: 0,
                last_call_output_tokens: 0
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBe(200000);
        expect(result.usedPercentage).toBe(0);
        expect(result.remainingPercentage).toBe(100);
        expect(result.remainingTokens).toBe(200000);
    });

    it('parses a post-turn payload with current_usage', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 200000,
                total_input_tokens: 35204,
                total_output_tokens: 16,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 35220,
                used_percentage: 18,
                remaining_percentage: 82,
                remaining_tokens: 164780,
                last_call_input_tokens: 35204,
                last_call_output_tokens: 16,
                current_usage: {
                    input_tokens: 35204,
                    output_tokens: 16,
                    cache_creation_input_tokens: 0,
                    cache_read_input_tokens: 0
                }
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBe(200000);
        expect(result.usedPercentage).toBe(18);
        expect(result.totalInputTokens).toBe(35204);
        expect(result.totalOutputTokens).toBe(16);
        expect(result.lastCallInputTokens).toBe(35204);
        expect(result.lastCallOutputTokens).toBe(16);
        expect(result.remainingTokens).toBe(164780);
        expect(result.cacheReadTokens).toBe(0);
        expect(result.cacheWriteTokens).toBe(0);
        // usedTokens/contextLengthTokens derived from remaining_tokens
        expect(result.usedTokens).toBe(200000 - 164780);
        expect(result.contextLengthTokens).toBe(200000 - 164780);
    });

    it('derives usedTokens from remaining_tokens, not cumulative current_usage', () => {
        // Simulates a long session with heavy caching where current_usage sums
        // far exceed the context window (cumulative across all API calls)
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 1000000,
                total_input_tokens: 3100000,
                total_output_tokens: 22400,
                total_cache_read_tokens: 2800000,
                total_cache_write_tokens: 0,
                total_tokens: 3122400,
                used_percentage: 75,
                remaining_percentage: 25,
                remaining_tokens: 250000,
                last_call_input_tokens: 50000,
                last_call_output_tokens: 1200,
                current_usage: {
                    input_tokens: 3100000,
                    output_tokens: 22400,
                    cache_creation_input_tokens: 0,
                    cache_read_input_tokens: 2800000
                }
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBe(1000000);
        // usedTokens should be derived from remaining_tokens, NOT current_usage sums
        expect(result.usedTokens).toBe(750000); // 1000000 - 250000
        expect(result.contextLengthTokens).toBe(750000);
        expect(result.usedPercentage).toBe(75);
        expect(result.remainingPercentage).toBe(25);
        // totalTokens should still use current_usage sum (it IS cumulative)
        expect(result.totalTokens).toBe(3100000 + 22400 + 2800000);
    });

    it('falls back to used_percentage when remaining_tokens is absent', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 200000,
                total_input_tokens: 50000,
                total_output_tokens: 5000,
                used_percentage: 30,
                remaining_percentage: 70
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.usedTokens).toBe(60000); // 30% of 200000
        expect(result.contextLengthTokens).toBe(60000);
        expect(result.usedPercentage).toBe(30);
    });
});