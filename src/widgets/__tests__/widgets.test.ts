import {
    describe,
    expect,
    it
} from 'vitest';

import type { CopilotPayload } from '../../types/CopilotPayload';
import type { RenderContext } from '../../types/RenderContext';
import type { Settings } from '../../types/Settings';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import { ApiCallsWidget } from '../ApiCalls';
import { CacheReadTokensWidget } from '../CacheReadTokens';
import { CacheWriteTokensWidget } from '../CacheWriteTokens';
import { ContextBarWidget } from '../ContextBar';
import { ContextLengthWidget } from '../ContextLength';
import { ContextPercentageWidget } from '../ContextPercentage';
import { LastCallInputWidget } from '../LastCallInput';
import { LastCallOutputWidget } from '../LastCallOutput';
import { ModelWidget } from '../Model';
import { ModelMultiplierWidget } from '../ModelMultiplier';
import { PremiumRateWidget } from '../PremiumRate';
import { PremiumRequestsWidget } from '../PremiumRequests';
import { RemainingTokensWidget } from '../RemainingTokens';
import { SessionClockWidget } from '../SessionClock';
import { SessionIdWidget } from '../SessionId';
import { SessionNameWidget } from '../SessionName';
import { ThinkingEffortWidget } from '../ThinkingEffort';
import { TokensInputWidget } from '../TokensInput';
import { TokensOutputWidget } from '../TokensOutput';
import { TokensTotalWidget } from '../TokensTotal';
import { VersionWidget } from '../Version';

const settings: Settings = DEFAULT_SETTINGS;

function item(overrides?: Partial<WidgetItem>): WidgetItem {
    return { id: '1', type: 'test', ...overrides };
}

function ctx(data?: CopilotPayload): RenderContext {
    return { data };
}

const postTurnPayload: CopilotPayload = {
    cwd: '/workspace',
    session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
    session_name: 'Say Hello',
    model: { id: 'claude-opus-4.6', display_name: 'claude-opus-4.6 (3x) (high)' },
    workspace: { current_dir: '/workspace' },
    version: '1.0.21',
    cost: {
        total_api_duration_ms: 1696,
        total_lines_added: 10,
        total_lines_removed: 2,
        total_duration_ms: 39619,
        total_premium_requests: 3
    },
    context_window: {
        total_input_tokens: 35204,
        total_output_tokens: 16,
        total_cache_read_tokens: 500,
        total_cache_write_tokens: 300,
        total_reasoning_tokens: 0,
        total_tokens: 35220,
        context_window_size: 200000,
        displayed_context_limit: 200000,
        current_context_tokens: 36000,
        current_context_used_percentage: 18,
        used_percentage: 18,
        remaining_percentage: 82,
        remaining_tokens: 164780,
        last_call_input_tokens: 35204,
        last_call_output_tokens: 16
    }
};

const startupPayload: CopilotPayload = {
    cwd: '/workspace',
    session_id: '39a86125-b571-455f-9237-1671d7aa4df9',
    session_name: null,
    model: { id: null, display_name: null },
    workspace: { current_dir: '/workspace' },
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

describe('ModelWidget', () => {
    const widget = new ModelWidget();

    it('renders model id', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Model: claude-opus-4.6');
    });

    it('renders raw model id', () => {
        expect(widget.render(item({ rawValue: true }), ctx(postTurnPayload), settings)).toBe('claude-opus-4.6');
    });

    it('returns null for null model id', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('VersionWidget', () => {
    const widget = new VersionWidget();

    it('renders version', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('v1.0.21');
    });

    it('renders raw version', () => {
        expect(widget.render(item({ rawValue: true }), ctx(postTurnPayload), settings)).toBe('1.0.21');
    });
});

describe('SessionNameWidget', () => {
    const widget = new SessionNameWidget();

    it('renders session name', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Session: Say Hello');
    });

    it('returns null when session_name is null', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('SessionIdWidget', () => {
    const widget = new SessionIdWidget();

    it('renders short session id', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('ID: 39a86125');
    });

    it('renders raw short session id', () => {
        expect(widget.render(item({ rawValue: true }), ctx(postTurnPayload), settings)).toBe('39a86125');
    });
});

describe('ThinkingEffortWidget', () => {
    const widget = new ThinkingEffortWidget();

    it('renders thinking effort from display_name', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Thinking: high');
    });

    it('renders explicit thinking effort from model payload', () => {
        expect(widget.render(
            item(),
            ctx({
                ...postTurnPayload,
                model: {
                    id: 'gpt-5',
                    display_name: 'gpt-5',
                    thinking_effort_level: 'minimal'
                }
            }),
            settings
        )).toBe('Thinking: minimal');
    });

    it('renders max thinking effort from model payload', () => {
        expect(widget.render(
            item(),
            ctx({
                ...postTurnPayload,
                model: {
                    id: 'gpt-5',
                    display_name: 'gpt-5',
                    thinking_effort_level: 'max'
                }
            }),
            settings
        )).toBe('Thinking: max');
    });

    it('renders thinking effort from thinking_effort field', () => {
        expect(widget.render(
            item(),
            ctx({
                ...postTurnPayload,
                model: {
                    id: 'gpt-5',
                    display_name: 'gpt-5 (high)',
                    thinking_effort: 'low'
                }
            }),
            settings
        )).toBe('Thinking: low');
    });

    it('renders thinking effort from reasoning_effort field', () => {
        expect(widget.render(
            item(),
            ctx({
                ...postTurnPayload,
                model: {
                    id: 'gpt-5',
                    display_name: 'gpt-5 (high)',
                    reasoning_effort: 'medium'
                }
            }),
            settings
        )).toBe('Thinking: medium');
    });

    it('prefers thinking_effort_level over other effort fields and display_name', () => {
        expect(widget.render(
            item(),
            ctx({
                ...postTurnPayload,
                model: {
                    id: 'gpt-5',
                    display_name: 'gpt-5 (low)',
                    thinking_effort_level: 'max',
                    thinking_effort: 'minimal',
                    reasoning_effort: 'medium'
                }
            }),
            settings
        )).toBe('Thinking: max');
    });

    it('returns null when display_name is null', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('ModelMultiplierWidget', () => {
    const widget = new ModelMultiplierWidget();

    it('renders multiplier from display_name', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Multiplier: 3x');
    });

    it('renders raw multiplier', () => {
        expect(widget.render(item({ rawValue: true }), ctx(postTurnPayload), settings)).toBe('3x');
    });

    it('returns null when display_name is null', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('TokensInputWidget', () => {
    const widget = new TokensInputWidget();

    it('renders total input tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('In: 35.2k');
    });
});

describe('TokensOutputWidget', () => {
    const widget = new TokensOutputWidget();

    it('renders total output tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Out: 16');
    });
});

describe('TokensTotalWidget', () => {
    const widget = new TokensTotalWidget();

    it('renders total tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Total: 35.2k');
    });
});

describe('ContextLengthWidget', () => {
    const widget = new ContextLengthWidget();

    it('renders current context tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Ctx: 36.0k');
    });

    it('returns null when current_context_tokens is null', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('ContextPercentageWidget', () => {
    const widget = new ContextPercentageWidget();

    it('renders used percentage', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Ctx Used: 18.0%');
    });

    it('renders remaining percentage with an explicit label', () => {
        expect(widget.render(item({ metadata: { inverse: 'true' } }), ctx(postTurnPayload), settings)).toBe('Ctx Left: 82.0%');
    });

    it('renders a compact slider display', () => {
        expect(widget.render(item({ metadata: { display: 'slider' } }), ctx(postTurnPayload), settings)).toBe('Ctx Used: ▓▓░░░░░░░░ 18.0%');
    });

    it('renders slider-only as a raw value when requested', () => {
        expect(widget.render(item({ rawValue: true, metadata: { display: 'slider-only' } }), ctx(postTurnPayload), settings)).toBe('▓▓░░░░░░░░');
    });

    it('returns null when percentage is null', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('ContextBarWidget', () => {
    const widget = new ContextBarWidget();

    it('renders a compact slider display', () => {
        expect(widget.render(item({ metadata: { display: 'slider' } }), ctx(postTurnPayload), settings)).toBe('Context: ▓▓░░░░░░░░ 36k/200k (18%)');
    });

    it('renders a slider-only display', () => {
        expect(widget.render(item({ metadata: { display: 'slider-only' } }), ctx(postTurnPayload), settings)).toBe('Context: ▓▓░░░░░░░░');
    });

    it('cycles through progress and slider display modes', () => {
        const full = widget.handleEditorAction('toggle-progress', item({ metadata: { display: 'progress-short' } }));
        const slider = widget.handleEditorAction('toggle-progress', item({ metadata: { display: 'progress' } }));
        const sliderOnly = widget.handleEditorAction('toggle-progress', item({ metadata: { display: 'slider' } }));
        const short = widget.handleEditorAction('toggle-progress', item({ metadata: { display: 'slider-only' } }));

        expect(full?.metadata?.display).toBe('progress');
        expect(slider?.metadata?.display).toBe('slider');
        expect(sliderOnly?.metadata?.display).toBe('slider-only');
        expect(short?.metadata?.display).toBe('progress-short');
    });
});

describe('SessionClockWidget', () => {
    const widget = new SessionClockWidget();

    it('formats duration < 1 minute', () => {
        const data = { ...postTurnPayload, cost: { ...postTurnPayload.cost, total_duration_ms: 30000 } };
        expect(widget.render(item(), ctx(data), settings)).toBe('Session: <1m');
    });

    it('formats duration in minutes', () => {
        const data = { ...postTurnPayload, cost: { ...postTurnPayload.cost, total_duration_ms: 300000 } };
        expect(widget.render(item(), ctx(data), settings)).toBe('Session: 5m');
    });

    it('formats duration in hours and minutes', () => {
        const data = { ...postTurnPayload, cost: { ...postTurnPayload.cost, total_duration_ms: 8100000 } };
        expect(widget.render(item(), ctx(data), settings)).toBe('Session: 2hr 15m');
    });
});

describe('PremiumRequestsWidget', () => {
    const widget = new PremiumRequestsWidget();

    it('renders total premium requests', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Reqs: 3');
    });

    it('renders raw value', () => {
        expect(widget.render(item({ rawValue: true }), ctx(postTurnPayload), settings)).toBe('3');
    });
});

describe('ApiCallsWidget', () => {
    const widget = new ApiCallsWidget();

    it('computes api calls = premium_requests / multiplier', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Calls: 1');
    });

    it('returns null when multiplier unavailable', () => {
        expect(widget.render(item(), ctx(startupPayload), settings)).toBeNull();
    });
});

describe('PremiumRateWidget', () => {
    const widget = new PremiumRateWidget();

    it('computes requests per minute', () => {
        // 3 requests over 39619ms ≈ 0.66 minutes → 3/0.66 ≈ 4.5/min
        const result = widget.render(item(), ctx(postTurnPayload), settings);
        expect(result).toMatch(/Rate: \d+\.\d\/min/);
    });

    it('returns null when duration is 0', () => {
        const data = { ...postTurnPayload, cost: { ...postTurnPayload.cost, total_duration_ms: 0 } };
        expect(widget.render(item(), ctx(data), settings)).toBeNull();
    });
});

describe('LastCallInputWidget', () => {
    const widget = new LastCallInputWidget();

    it('renders last call input tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Last In: 35.2k');
    });
});

describe('LastCallOutputWidget', () => {
    const widget = new LastCallOutputWidget();

    it('renders last call output tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Last Out: 16');
    });
});

describe('RemainingTokensWidget', () => {
    const widget = new RemainingTokensWidget();

    it('renders remaining tokens (displayed_context_limit - current_context_tokens)', () => {
        // 200000 - 36000 = 164000
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Remaining: 164.0k');
    });
});

describe('CacheReadTokensWidget', () => {
    const widget = new CacheReadTokensWidget();

    it('renders cache read tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Cache R: 500');
    });
});

describe('CacheWriteTokensWidget', () => {
    const widget = new CacheWriteTokensWidget();

    it('renders cache write tokens', () => {
        expect(widget.render(item(), ctx(postTurnPayload), settings)).toBe('Cache W: 300');
    });
});