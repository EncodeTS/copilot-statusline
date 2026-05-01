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
        expect(result.currentContextTokens).toBeNull();
        expect(result.currentContextUsedPercentage).toBeNull();
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
                last_call_input_tokens: 0,
                last_call_output_tokens: 0
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBeNull();
        expect(result.currentContextUsedPercentage).toBeNull();
        expect(result.totalInputTokens).toBe(0);
    });

    it('exposes current_context_tokens and current_context_used_percentage from payload', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 1000000,
                displayed_context_limit: 1000000,
                current_context_tokens: 33205,
                current_context_used_percentage: 3,
                total_input_tokens: 43954,
                total_output_tokens: 15,
                total_tokens: 43969
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBe(1000000);
        expect(result.displayedContextLimit).toBe(1000000);
        expect(result.currentContextTokens).toBe(33205);
        expect(result.currentContextUsedPercentage).toBe(3);
    });

    it('exposes displayed_context_limit when it differs from context_window_size (e.g. gpt-5.5)', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 400000,
                displayed_context_limit: 304000,
                current_context_tokens: 27805,
                current_context_used_percentage: 9
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.windowSize).toBe(400000);
        expect(result.displayedContextLimit).toBe(304000);
    });

    it('clamps current_context_used_percentage at 100 (overflow case)', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 400000,
                displayed_context_limit: 304000,
                current_context_tokens: 453076,
                current_context_used_percentage: 100
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.currentContextUsedPercentage).toBe(100);
    });

    it('exposes reasoning, last-call, and cache token counts', () => {
        const data: CopilotPayload = {
            context_window: {
                context_window_size: 200000,
                total_input_tokens: 35204,
                total_output_tokens: 16,
                total_cache_read_tokens: 500,
                total_cache_write_tokens: 300,
                total_reasoning_tokens: 1024,
                total_tokens: 35220,
                last_call_input_tokens: 35204,
                last_call_output_tokens: 16
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.cacheReadTokens).toBe(500);
        expect(result.cacheWriteTokens).toBe(300);
        expect(result.cachedTokens).toBe(800);
        expect(result.reasoningTokens).toBe(1024);
        expect(result.lastCallInputTokens).toBe(35204);
        expect(result.lastCallOutputTokens).toBe(16);
    });

    it('falls back totalTokens to total_input + total_output when total_tokens absent', () => {
        const data: CopilotPayload = {
            context_window: {
                total_input_tokens: 50000,
                total_output_tokens: 5000
            }
        };

        const result = getContextWindowMetrics(data);
        expect(result.totalTokens).toBe(55000);
    });
});