import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMetadataRepository } from '../src/repository.js';
import type { AppMetadata } from '../src/types.js';

function makeRecord(overrides: Partial<AppMetadata> = {}): AppMetadata {
  return {
    id: 'id-1',
    name: 'Example',
    platform: 'ios',
    version: '1.0.0',
    tags: ['alpha'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryMetadataRepository', () => {
  let repo: InMemoryMetadataRepository;

  beforeEach(() => {
    repo = new InMemoryMetadataRepository();
  });

  it('creates and finds a record', async () => {
    const created = await repo.create(makeRecord());
    expect(created).toEqual(makeRecord());

    const found = await repo.findById('id-1');
    expect(found).toEqual(makeRecord());
  });

  it('returns null for a missing record', async () => {
    expect(await repo.findById('nope')).toBeNull();
  });

  it('returns null when updating a missing record', async () => {
    const result = await repo.update('nope', makeRecord({ id: 'nope' }));
    expect(result).toBeNull();
  });

  it('updates an existing record', async () => {
    await repo.create(makeRecord());
    const updated = await repo.update('id-1', makeRecord({ name: 'Renamed' }));
    expect(updated?.name).toBe('Renamed');
    expect((await repo.findById('id-1'))?.name).toBe('Renamed');
  });

  it('deletes a record and reports existence', async () => {
    await repo.create(makeRecord());
    expect(await repo.delete('id-1')).toBe(true);
    expect(await repo.delete('id-1')).toBe(false);
    expect(await repo.findById('id-1')).toBeNull();
  });

  it('clears the store', async () => {
    await repo.create(makeRecord({ id: 'a' }));
    await repo.create(makeRecord({ id: 'b' }));
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  describe('defensive copies', () => {
    it('mutating the input after create does not change the store', async () => {
      const input = makeRecord();
      await repo.create(input);
      input.name = 'Mutated';
      input.tags.push('injected');

      const found = await repo.findById('id-1');
      expect(found?.name).toBe('Example');
      expect(found?.tags).toEqual(['alpha']);
    });

    it('mutating a returned record does not change the store', async () => {
      const created = await repo.create(makeRecord());
      created.name = 'Mutated';
      created.tags.push('injected');

      const found = await repo.findById('id-1');
      expect(found?.name).toBe('Example');
      expect(found?.tags).toEqual(['alpha']);
    });

    it('mutating a record from list does not change the store', async () => {
      await repo.create(makeRecord());
      const list = await repo.list();
      list[0].tags.push('injected');

      const found = await repo.findById('id-1');
      expect(found?.tags).toEqual(['alpha']);
    });
  });

  describe('list filtering and ordering', () => {
    beforeEach(async () => {
      await repo.create(
        makeRecord({ id: '1', platform: 'ios', tags: ['game', 'free'] }),
      );
      await repo.create(
        makeRecord({ id: '2', platform: 'android', tags: ['game'] }),
      );
      await repo.create(
        makeRecord({ id: '3', platform: 'ios', tags: ['free'] }),
      );
      await repo.create(
        makeRecord({ id: '4', platform: 'web', tags: [] }),
      );
    });

    it('preserves insertion order with no filter', async () => {
      const ids = (await repo.list()).map((r) => r.id);
      expect(ids).toEqual(['1', '2', '3', '4']);
    });

    it('filters by platform', async () => {
      const ids = (await repo.list({ platform: 'ios' })).map((r) => r.id);
      expect(ids).toEqual(['1', '3']);
    });

    it('filters by tag', async () => {
      const ids = (await repo.list({ tag: 'game' })).map((r) => r.id);
      expect(ids).toEqual(['1', '2']);
    });

    it('combines platform and tag with AND', async () => {
      const ids = (
        await repo.list({ platform: 'ios', tag: 'free' })
      ).map((r) => r.id);
      expect(ids).toEqual(['1', '3']);
    });

    it('returns empty when nothing matches the combined filter', async () => {
      const result = await repo.list({ platform: 'web', tag: 'game' });
      expect(result).toEqual([]);
    });
  });
});
