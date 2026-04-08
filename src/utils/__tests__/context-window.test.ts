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
    });
});