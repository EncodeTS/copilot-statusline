import { z } from 'zod';

// Schema for chalk color level
export const ColorLevelSchema = z.union([
    z.literal(0), // No colors
    z.literal(1), // Basic 16 colors
    z.literal(2), // 256 colors
    z.literal(3)  // Truecolor (16 million)
]);

export type ColorLevel = z.infer<typeof ColorLevelSchema>;

export type ColorLevelString = 'ansi16' | 'ansi256' | 'truecolor';

export function getColorLevelString(level: ColorLevel | undefined): ColorLevelString {
    switch (level) {
        case 0:
        case 1:
            return 'ansi16';
        case 3:
            return 'truecolor';
        case 2:
        default:
            return 'ansi256';
    }
}