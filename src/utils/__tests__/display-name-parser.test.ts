import {
    describe,
    expect,
    it
} from 'vitest';

import { parseDisplayName } from '../display-name-parser';

describe('parseDisplayName', () => {
    it('parses "claude-opus-4.6 (3x) (high)"', () => {
        const result = parseDisplayName('claude-opus-4.6 (3x) (high)');
        expect(result.thinkingEffort).toBe('high');
        expect(result.multiplier).toBe('3x');
        expect(result.multiplierValue).toBe(3);
    });

    it('parses "claude-sonnet-4.5 (1x) (low)"', () => {
        const result = parseDisplayName('claude-sonnet-4.5 (1x) (low)');
        expect(result.thinkingEffort).toBe('low');
        expect(result.multiplier).toBe('1x');
        expect(result.multiplierValue).toBe(1);
    });

    it('parses "Claude Opus 4.6 (1M context)(Internal only) (high)"', () => {
        const result = parseDisplayName('Claude Opus 4.6 (1M context)(Internal only) (high)');
        expect(result.thinkingEffort).toBe('high');
        expect(result.multiplier).toBeNull();
        expect(result.multiplierValue).toBeNull();
    });

    it('parses effort only — no multiplier', () => {
        const result = parseDisplayName('gpt-4o (medium)');
        expect(result.thinkingEffort).toBe('medium');
        expect(result.multiplier).toBeNull();
    });

    it('parses minimal effort', () => {
        const result = parseDisplayName('gpt-5 (minimal)');
        expect(result.thinkingEffort).toBe('minimal');
        expect(result.multiplier).toBeNull();
    });

    it('parses xhigh effort', () => {
        const result = parseDisplayName('gpt-5 (xhigh)');
        expect(result.thinkingEffort).toBe('xhigh');
        expect(result.multiplier).toBeNull();
    });

    it('parses max effort', () => {
        const result = parseDisplayName('gpt-5 (max)');
        expect(result.thinkingEffort).toBe('max');
        expect(result.multiplier).toBeNull();
    });

    it('parses labeled effort', () => {
        const result = parseDisplayName('gpt-5 (3x) (thinking effort: high)');
        expect(result.thinkingEffort).toBe('high');
        expect(result.multiplier).toBe('3x');
    });

    it('parses labeled max effort', () => {
        const result = parseDisplayName('gpt-5 (3x) (thinking effort: max)');
        expect(result.thinkingEffort).toBe('max');
        expect(result.multiplier).toBe('3x');
    });

    it('parses combined multiplier and effort group', () => {
        const result = parseDisplayName('gpt-5 (3x, high)');
        expect(result.thinkingEffort).toBe('high');
        expect(result.multiplier).toBe('3x');
        expect(result.multiplierValue).toBe(3);
    });

    it('parses multiplier only — no effort', () => {
        const result = parseDisplayName('claude-opus-4.6 (6x)');
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBe('6x');
        expect(result.multiplierValue).toBe(6);
    });

    it('returns null for null display_name', () => {
        const result = parseDisplayName(null);
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBeNull();
        expect(result.multiplierValue).toBeNull();
    });

    it('returns null for undefined display_name', () => {
        const result = parseDisplayName(undefined);
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBeNull();
    });

    it('returns null for plain model name without groups', () => {
        const result = parseDisplayName('claude-opus-4.6');
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBeNull();
    });

    it('ignores unrecognized effort levels', () => {
        const result = parseDisplayName('model (3x) (turbo)');
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBe('3x');
    });

    it('handles zero duration gracefully', () => {
        const result = parseDisplayName('');
        expect(result.thinkingEffort).toBeNull();
        expect(result.multiplier).toBeNull();
    });
});