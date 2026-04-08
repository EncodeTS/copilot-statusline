export type ThinkingEffortLevel = 'low' | 'medium' | 'high';

export interface ParsedDisplayName {
    thinkingEffort: ThinkingEffortLevel | null;
    multiplier: string | null;
    multiplierValue: number | null;
}

const EFFORT_LEVELS = new Set<string>(['low', 'medium', 'high']);
const MULTIPLIER_REGEX = /^(\d+)x$/;

export function parseDisplayName(displayName: string | null | undefined): ParsedDisplayName {
    if (!displayName) {
        return { thinkingEffort: null, multiplier: null, multiplierValue: null };
    }

    // Extract all parenthesized groups
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

    // Search groups from last to first for effort (last matching group wins)
    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i]?.toLowerCase();
        if (group && EFFORT_LEVELS.has(group)) {
            thinkingEffort = group as ThinkingEffortLevel;
            break;
        }
    }

    // Search groups for multiplier
    for (const group of groups) {
        if (!group) {
            continue;
        }
        const multMatch = MULTIPLIER_REGEX.exec(group);
        if (multMatch?.[1]) {
            multiplier = group;
            multiplierValue = parseInt(multMatch[1], 10);
            break;
        }
    }

    return { thinkingEffort, multiplier, multiplierValue };
}