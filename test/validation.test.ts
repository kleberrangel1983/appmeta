import { describe, it, expect } from 'vitest';
import { validateCreate, validateUpdate } from '../src/validation.js';

function fieldsOf(result: { errors: { field: string }[] }): string[] {
  return result.errors.map((e) => e.field);
}

describe('validateCreate', () => {
  describe('valid payloads', () => {
    it('accepts a minimal payload (name, platform, version only)', () => {
      const result = validateCreate({
        name: 'My App',
        platform: 'ios',
        version: '1.0.0',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a full payload with description and tags', () => {
      const result = validateCreate({
        name: 'My App',
        platform: 'android',
        version: '10.20.30',
        description: 'A great app',
        tags: ['fun', 'productivity'],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts all valid platforms', () => {
      for (const platform of ['ios', 'android', 'web']) {
        const result = validateCreate({ name: 'X', platform, version: '0.0.0' });
        expect(result.valid).toBe(true);
      }
    });

    it('accepts an empty tags array', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'web',
        version: '1.2.3',
        tags: [],
      });
      expect(result.valid).toBe(true);
    });

    it('accepts exactly 20 tags', () => {
      const tags = Array.from({ length: 20 }, (_, i) => `t${i}`);
      const result = validateCreate({
        name: 'X',
        platform: 'web',
        version: '1.2.3',
        tags,
      });
      expect(result.valid).toBe(true);
    });

    it('accepts a 100-char name and a 30-char tag and a 500-char description', () => {
      const result = validateCreate({
        name: 'a'.repeat(100),
        platform: 'web',
        version: '1.2.3',
        description: 'd'.repeat(500),
        tags: ['t'.repeat(30)],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('name failures', () => {
    it('errors when name is missing', () => {
      const result = validateCreate({ platform: 'ios', version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('name');
    });

    it('errors when name is not a string', () => {
      const result = validateCreate({ name: 123, platform: 'ios', version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('name');
    });

    it('errors when name trims to empty', () => {
      const result = validateCreate({ name: '   ', platform: 'ios', version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('name');
    });

    it('errors when name exceeds 100 chars', () => {
      const result = validateCreate({
        name: 'a'.repeat(101),
        platform: 'ios',
        version: '1.0.0',
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('name');
    });
  });

  describe('platform failures', () => {
    it('errors when platform is missing', () => {
      const result = validateCreate({ name: 'X', version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('platform');
    });

    it('errors when platform is not in PLATFORMS', () => {
      const result = validateCreate({ name: 'X', platform: 'windows', version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('platform');
    });

    it('errors when platform is not a string', () => {
      const result = validateCreate({ name: 'X', platform: 42, version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('platform');
    });
  });

  describe('version failures', () => {
    it('errors when version is missing', () => {
      const result = validateCreate({ name: 'X', platform: 'ios' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('version');
    });

    it('errors when version is not a string', () => {
      const result = validateCreate({ name: 'X', platform: 'ios', version: 100 });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('version');
    });

    it('errors on a bad version format', () => {
      for (const version of ['1.0', '1', 'v1.0.0', '1.0.0.0', '1.0.x', 'abc', '']) {
        const result = validateCreate({ name: 'X', platform: 'ios', version });
        expect(result.valid).toBe(false);
        expect(fieldsOf(result)).toContain('version');
      }
    });
  });

  describe('description failures', () => {
    it('errors when description is not a string', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        description: 123,
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('description');
    });

    it('errors when description exceeds 500 chars', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        description: 'd'.repeat(501),
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('description');
    });
  });

  describe('tags failures', () => {
    it('errors when tags is not an array', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        tags: 'nope',
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });

    it('errors when there are more than 20 tags', () => {
      const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        tags,
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });

    it('errors on an empty tag string', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        tags: ['ok', ''],
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });

    it('errors on a non-string tag', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        tags: ['ok', 5],
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });

    it('errors when a tag exceeds 30 chars', () => {
      const result = validateCreate({
        name: 'X',
        platform: 'ios',
        version: '1.0.0',
        tags: ['t'.repeat(31)],
      });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });
  });

  describe('multiple failures', () => {
    it('reports one error per failing field', () => {
      const result = validateCreate({ name: '', platform: 'nope', version: 'bad' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result).sort()).toEqual(['name', 'platform', 'version']);
    });
  });

  describe('non-object inputs', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'hello'],
      ['number', 42],
      ['array', []],
      ['boolean', true],
    ])('rejects %s', (_label, value) => {
      const result = validateCreate(value);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
    });
  });
});

describe('validateUpdate', () => {
  describe('valid partial updates', () => {
    it('accepts a single name field', () => {
      const result = validateUpdate({ name: 'New Name' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a single platform field', () => {
      expect(validateUpdate({ platform: 'web' }).valid).toBe(true);
    });

    it('accepts a single version field', () => {
      expect(validateUpdate({ version: '2.3.4' }).valid).toBe(true);
    });

    it('accepts a single description field', () => {
      expect(validateUpdate({ description: 'desc' }).valid).toBe(true);
    });

    it('accepts a single tags field', () => {
      expect(validateUpdate({ tags: ['a', 'b'] }).valid).toBe(true);
    });

    it('accepts multiple fields together', () => {
      const result = validateUpdate({
        name: 'New',
        platform: 'android',
        version: '1.0.0',
        description: 'd',
        tags: [],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('empty object', () => {
    it('rejects an empty object', () => {
      const result = validateUpdate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
    });
  });

  describe('invalid field values', () => {
    it('errors on an invalid name', () => {
      const result = validateUpdate({ name: '   ' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('name');
    });

    it('errors on an invalid platform', () => {
      const result = validateUpdate({ platform: 'nope' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('platform');
    });

    it('errors on an invalid version', () => {
      const result = validateUpdate({ version: '1.0' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('version');
    });

    it('errors on an invalid description', () => {
      const result = validateUpdate({ description: 'd'.repeat(501) });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('description');
    });

    it('errors on invalid tags', () => {
      const result = validateUpdate({ tags: [''] });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result)).toContain('tags');
    });

    it('reports one error per failing provided field', () => {
      const result = validateUpdate({ name: '', version: 'bad' });
      expect(result.valid).toBe(false);
      expect(fieldsOf(result).sort()).toEqual(['name', 'version']);
    });
  });

  describe('non-object inputs', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'hello'],
      ['number', 42],
      ['array', []],
    ])('rejects %s', (_label, value) => {
      const result = validateUpdate(value);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('input');
    });
  });
});
