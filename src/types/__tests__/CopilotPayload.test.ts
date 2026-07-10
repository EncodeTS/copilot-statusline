import {
    describe,
    expect,
    it
} from 'vitest';

import { CopilotPayloadSchema } from '../CopilotPayload';

describe('CopilotPayloadSchema', () => {
    it('parses a startup payload (all nulls)', () => {
        const startup = {
            cwd: '/Users/example/workspace',
            session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
            session_name: null,
            transcript_path: '/Users/example/.copilot/session-state/39a86125-b571-455f-9237-1671d7aa4df9',
            model: { id: null, display_name: null },
            workspace: { current_dir: '/Users/example/workspace' },
            version: '1.0.21',
            cost: {
                total_api_duration_ms: 0,
                total_lines_added: 0,
                total_lines_removed: 0,
                total_duration_ms: 467,
                total_premium_requests: 0
            },
            context_window: {
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 0,
                context_window_size: null,
                used_percentage: null,
                remaining_percentage: null,
                remaining_tokens: null,
                last_call_input_tokens: 0,
                last_call_output_tokens: 0
            }
        };

        const result = CopilotPayloadSchema.safeParse(startup);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.session_name).toBeNull();
            expect(result.data.model?.id).toBeNull();
            expect(result.data.model?.display_name).toBeNull();
            expect(result.data.context_window?.context_window_size).toBeNull();
        }
    });

    it('parses a model-ready payload', () => {
        const modelReady = {
            cwd: '/Users/example/workspace',
            session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
            session_name: null,
            transcript_path: '/Users/example/.copilot/session-state/39a86125',
            model: {
                id: 'claude-opus-4.6',
                display_name: 'claude-opus-4.6 (3x) (high)',
                thinking_effort_level: 'high'
            },
            workspace: { current_dir: '/Users/example/workspace' },
            version: '1.0.21',
            cost: {
                total_api_duration_ms: 0,
                total_lines_added: 0,
                total_lines_removed: 0,
                total_duration_ms: 1504,
                total_premium_requests: 0
            },
            context_window: {
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 0,
                context_window_size: 200000,
                used_percentage: 0,
                remaining_percentage: 100,
                remaining_tokens: 200000,
                last_call_input_tokens: 0,
                last_call_output_tokens: 0
            }
        };

        const result = CopilotPayloadSchema.safeParse(modelReady);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.model?.id).toBe('claude-opus-4.6');
            expect(result.data.model?.display_name).toBe('claude-opus-4.6 (3x) (high)');
            expect(result.data.model?.thinking_effort_level).toBe('high');
            expect(result.data.context_window?.context_window_size).toBe(200000);
        }
    });

    it('parses a post-turn payload with current_usage', () => {
        const postTurn = {
            cwd: '/Users/example/workspace',
            session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
            session_name: 'Say Hello',
            transcript_path: '/Users/example/.copilot/session-state/39a86125',
            model: { id: 'claude-opus-4.6', display_name: 'claude-opus-4.6 (3x) (high)' },
            workspace: { current_dir: '/Users/example/workspace' },
            version: '1.0.21',
            cost: {
                total_api_duration_ms: 1696,
                total_lines_added: 0,
                total_lines_removed: 0,
                total_duration_ms: 39619,
                total_premium_requests: 3
            },
            context_window: {
                total_input_tokens: 35204,
                total_output_tokens: 16,
                total_cache_read_tokens: 0,
                total_cache_write_tokens: 0,
                total_tokens: 35220,
                context_window_size: 200000,
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

        const result = CopilotPayloadSchema.safeParse(postTurn);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.session_name).toBe('Say Hello');
            expect(result.data.cost?.total_premium_requests).toBe(3);
            expect(result.data.context_window?.current_usage?.input_tokens).toBe(35204);
            expect(result.data.context_window?.last_call_input_tokens).toBe(35204);
            expect(result.data.context_window?.remaining_tokens).toBe(164780);
        }
    });

    it('parses current AI Credits payload fields', () => {
        const result = CopilotPayloadSchema.safeParse({
            cwd: '/Users/example/workspace',
            session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
            session_name: 'Session Initialization',
            transcript_path: '/Users/example/.copilot/session-state/39a86125',
            username: null,
            model: {
                id: 'gpt-5.5',
                display_name: 'gpt-5.5 · xhigh · 1.1M context'
            },
            workspace: { current_dir: '/Users/example/workspace' },
            remote: { connected: false },
            version: '1.0.57-5',
            allow_all_enabled: false,
            ai_used: {
                formatted: '12.8',
                total_nano_aiu: 12791900000
            },
            cost: {
                total_api_duration_ms: 10418,
                total_lines_added: 0,
                total_lines_removed: 0,
                total_duration_ms: 83916,
                total_premium_requests: 15
            },
            context_window: {
                total_input_tokens: 45775,
                total_output_tokens: 14,
                total_cache_read_tokens: 22528,
                total_cache_write_tokens: 0,
                total_reasoning_tokens: 0,
                total_tokens: 45789,
                context_window_size: 1050000,
                used_percentage: 4,
                remaining_percentage: 96,
                remaining_tokens: 1004211,
                last_call_input_tokens: 22922,
                last_call_output_tokens: 8,
                current_context_tokens: 24008,
                current_context_used_percentage: 2,
                displayed_context_limit: 1050000
            }
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.username).toBeNull();
            expect(result.data.allow_all_enabled).toBe(false);
            expect(result.data.ai_used?.formatted).toBe('12.8');
            expect(result.data.ai_used?.total_nano_aiu).toBe(12791900000);
        }
    });

    it('parses an empty object gracefully', () => {
        const result = CopilotPayloadSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('preserves unknown payload fields for forward compatibility', () => {
        const result = CopilotPayloadSchema.safeParse({
            future_top_level: { enabled: true },
            model: {
                id: 'future-model',
                future_model_field: 'value'
            },
            context_window: {
                future_context_field: 123,
                current_usage: {
                    input_tokens: 42,
                    future_usage_field: 'value'
                }
            }
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.future_top_level).toEqual({ enabled: true });
            expect(result.data.model?.future_model_field).toBe('value');
            expect(result.data.context_window?.future_context_field).toBe(123);
            expect(result.data.context_window?.current_usage?.future_usage_field).toBe('value');
        }
    });

    it('rejects non-object input', () => {
        expect(CopilotPayloadSchema.safeParse('invalid').success).toBe(false);
        expect(CopilotPayloadSchema.safeParse(42).success).toBe(false);
        expect(CopilotPayloadSchema.safeParse(null).success).toBe(false);
    });
});