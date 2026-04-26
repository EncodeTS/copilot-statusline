import {
    describe,
    expect,
    it
} from 'vitest';

import { generateGuid } from '../guid';

describe('generateGuid', () => {
    it('generates UUID v4-like unique IDs', () => {
        const ids = Array.from({ length: 100 }, () => generateGuid());

        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        }
    });
});