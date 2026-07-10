import { z } from 'zod';

const OptionalNumber = z.number().nullable().optional();

export const CopilotPayloadSchema = z.object({
    cwd: z.string().optional(),
    session_id: z.string().optional(),
    session_name: z.string().nullable().optional(),
    transcript_path: z.string().optional(),
    username: z.string().nullable().optional(),
    model: z.object({
        id: z.string().nullable().optional(),
        display_name: z.string().nullable().optional(),
        thinking_effort: z.string().nullable().optional(),
        thinking_effort_level: z.string().nullable().optional(),
        reasoning_effort: z.string().nullable().optional()
    }).loose().optional(),
    workspace: z.object({ current_dir: z.string().optional() }).loose().optional(),
    remote: z.object({ connected: z.boolean().optional() }).loose().optional(),
    version: z.string().optional(),
    allow_all_enabled: z.boolean().optional(),
    cost: z.object({
        total_api_duration_ms: z.number().optional(),
        total_duration_ms: z.number().optional(),
        total_lines_added: z.number().optional(),
        total_lines_removed: z.number().optional(),
        total_premium_requests: z.number().optional()
    }).loose().optional(),
    ai_used: z.object({
        formatted: z.string().nullable().optional(),
        total_nano_aiu: OptionalNumber
    }).loose().nullable().optional(),
    context_window: z.object({
        context_window_size: OptionalNumber,
        total_input_tokens: z.number().optional(),
        total_output_tokens: z.number().optional(),
        total_cache_read_tokens: z.number().optional(),
        total_cache_write_tokens: z.number().optional(),
        total_reasoning_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
        used_percentage: OptionalNumber,
        remaining_percentage: OptionalNumber,
        remaining_tokens: OptionalNumber,
        last_call_input_tokens: z.number().optional(),
        last_call_output_tokens: z.number().optional(),
        current_context_tokens: OptionalNumber,
        current_context_used_percentage: OptionalNumber,
        displayed_context_limit: OptionalNumber,
        current_usage: z.object({
            input_tokens: z.number().optional(),
            output_tokens: z.number().optional(),
            cache_creation_input_tokens: z.number().optional(),
            cache_read_input_tokens: z.number().optional()
        }).loose().optional()
    }).loose().optional()
}).loose();

export type CopilotPayload = z.infer<typeof CopilotPayloadSchema>;