const THINKING_EFFORT_LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const;

export type ThinkingEffortLevel = typeof THINKING_EFFORT_LEVELS[number];

export interface ParsedDisplayName {
    thinkingEffort: ThinkingEffortLevel | null;
    multiplier: string | null;
    multiplierValue: number | null;
}

const EFFORT_LEVELS: ReadonlySet<string> = new Set(THINKING_EFFORT_LEVELS);
const EFFORT_LEVEL_PATTERN = THINKING_EFFORT_LEVELS.join('|');
const MULTIPLIER_REGEX = /^(\d+)x$/;
const LABELED_EFFORT_REGEX = new RegExp(`^(?:thinking|reasoning|effort)(?:[-_ ](?:effort|level))?\\s*[:=]\\s*(${EFFORT_LEVEL_PATTERN})$`);

export function normalizeThinkingEffort(value: string | null | undefined): ThinkingEffortLevel | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (EFFORT_LEVELS.has(normalized)) {
        return normalized as ThinkingEffortLevel;
    }

    const match = LABELED_EFFORT_REGEX.exec(normalized);
    return match?.[1] ? match[1] as ThinkingEffortLevel : null;
}

// Trust the value as-is (only trim + lowercase). Use for fields that the
// upstream payload dedicates to effort, like `model.thinking_effort_level` —
// no whitelist, so new levels added by Copilot show up without a code change.
export function trustThinkingEffort(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized || null;
}

export function parseDisplayName(displayName: string | null | undefined): ParsedDisplayName {
    if (!displayName) {
        return { thinkingEffort: null, multiplier: null, multiplierValue: null };
    }

    const groups: string[] = [];
    const groupRegex = /\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = groupRegex.exec(displayName)) !== null) {
        const content = match[1]?.trim();
        if (content) {
            groups.push(content);
        }
    }

    let thinkingEffort: ThinkingEffortLevel | null = null;
    let multiplier: string | null = null;
    let multiplierValue: number | null = null;

    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        if (!group) {
            continue;
        }
        const parts = group.split(/[,;|]/).map(part => part.trim());
        for (let partIndex = parts.length - 1; partIndex >= 0; partIndex--) {
            const effort = normalizeThinkingEffort(parts[partIndex]);
            if (effort) {
                thinkingEffort = effort;
                break;
            }
        }
        if (thinkingEffort) {
            break;
        }
    }

    for (const group of groups) {
        if (!group) {
            continue;
        }
        const parts = group.split(/[,;|]/).map(part => part.trim());
        for (const part of parts) {
            const multMatch = MULTIPLIER_REGEX.exec(part);
            if (multMatch?.[1]) {
                multiplier = part;
                multiplierValue = parseInt(multMatch[1], 10);
                break;
            }
        }
        if (multiplier) {
            break;
        }
    }

    return { thinkingEffort, multiplier, multiplierValue };
}