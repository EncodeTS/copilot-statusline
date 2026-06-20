import {
    describe,
    expect,
    it
} from 'vitest';

import { formatTokens } from '../format-tokens';

describe('formatTokens', () => {
    it('keeps default one-decimal k formatting below the 1M rounding boundary', () => {
        expect(formatTokens(12345)).toBe('12.3k');
        expect(formatTokens(999949)).toBe('999.9k');
    });

    it('promotes values that would round to 1000k into the M range', () => {
        expect(formatTokens(999950)).toBe('1.0M');
        expect(formatTokens(999500, 0)).toBe('1.0M');
        expect(formatTokens(999499, 0)).toBe('999k');
    });

    it('supports compact whole-number k formatting', () => {
        expect(formatTokens(12345, 0)).toBe('12k');
    });
});