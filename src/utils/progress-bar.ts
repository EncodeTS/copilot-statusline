// Placeholder that the Powerline renderer replaces with the widget's actual fg ANSI code.
// Uses an ESC[ private-use CSI sequence so ANSI parsers treat it as invisible/zero-width.
export const PROGRESS_BAR_FG_RESTORE = '\x1b[0;999;0q';

export function makeUsageProgressBar(percent: number, width = 15, powerlineMode = false): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    if (powerlineMode) {
        // In Powerline mode, the theme fg can be dark (e.g. black) making █ invisible.
        // Only the filled blocks get bright white; empty blocks stay in the theme fg
        // so they blend naturally with the background (e.g. black ░ on yellow is subtle).
        const filledStr = filled > 0
            ? `\x1b[38;5;231m${'█'.repeat(filled)}${PROGRESS_BAR_FG_RESTORE}`
            : '';
        return `[${filledStr}${'░'.repeat(empty)}]`;
    }

    return '[' + bar + ']';
}