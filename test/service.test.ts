import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryMetadataRepository } from '../src/repository.js';
import { MetadataService } from '../src/service.js';
import {
  NotFoundError,
  ValidationFailedError,
} from '../src/types.js';
import type { CreateMetadataInput } from '../src/types.js';

function validInput(
  overrides: Partial<CreateMetadataInput> = {},
): CreateMetadataInput {
  return {
    name: 'My App',
    platform: 'ios',
    version: '1.0.0',
    ...overrides,
  };
}

describe('MetadataService', () => {
  let repo: InMemoryMetadataRepository;
  let service: MetadataService;

  beforeEach(() => {
    repo = new InMemoryMetadataRepository();
    service = new MetadataService(repo);
  });

  describe('create', () => {
    it('assigns id, timestamps, and defaults tags to []', async () => {
      const record = await service.create(validInput());

      expect(record.id).toBeTypeOf('string');
      expect(record.id.length).toBeGreaterThan(0);
      expect(record.tags).toEqual([]);
      expect(record.createdAt).toBe(record.updatedAt);
      expect(() => new Date(record.createdAt).toISOString()).not.toThrow();
      expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);

      // persisted
      const found = await repo.findById(record.id);
      expect(found).toEqual(record);
    });

    it('preserves provided tags and description', async () => {
      const record = await service.create(
        validInput({ tags: ['a', 'b'], description: 'hi' }),
      );
      expect(record.tags).toEqual(['a', 'b']);
      expect(record.description).toBe('hi');
    });

    it('assigns unique ids across creates', async () => {
      const a = await service.create(validInput());
      const b = await service.create(validInput());
      expect(a.id).not.toBe(b.id);
    });

    it('throws ValidationFailedError for invalid input', async () => {
      await expect(
        service.create({
          name: '',
          platform: 'ios',
          version: 'bad',
        } as CreateMetadataInput),
      ).rejects.toBeInstanceOf(ValidationFailedError);
    });

    it('does not persist when validation fails', async () => {
      await expect(
        service.create({ name: '' } as CreateMetadataInput),
      ).rejects.toBeInstanceOf(ValidationFailedError);
      expect(await repo.list()).toEqual([]);
    });
  });

  describe('get', () => {
    it('returns an existing record', async () => {
      const created = await service.create(validInput());
      expect(await service.get(created.id)).toEqual(created);
    });

    it('throws NotFoundError for a missing id', async () => {
      await expect(service.get('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('list', () => {
    it('passes the filter through to the repository', async () => {
      const filter = { platform: 'android', tag: 'x' } as const;
      const spy = vi.spyOn(repo, 'list');
      await service.list(filter);
      expect(spy).toHaveBeenCalledWith(filter);
    });

    it('returns records matching the filter', async () => {
      await service.create(validInput({ platform: 'ios', tags: ['x'] }));
      await service.create(validInput({ platform: 'android', tags: ['x'] }));
      const result = await service.list({ platform: 'ios' });
      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('ios');
    });
  });

  describe('update', () => {
    it('merges only provided fields and bumps updatedAt', async () => {
      const created = await service.create(
        validInput({ tags: ['orig'], description: 'orig desc' }),
      );

      // Ensure a measurably different timestamp.
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.parse(created.updatedAt) + 1000));

      const updated = await service.update(created.id, { name: 'New Name' });

      vi.useRealTimers();

      expect(updated.name).toBe('New Name');
      expect(updated.platform).toBe(created.platform);
      expect(updated.version).toBe(created.version);
      expect(updated.tags).toEqual(['orig']);
      expect(updated.description).toBe('orig desc');
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).not.toBe(created.updatedAt);

      // persisted
      expect((await repo.findById(created.id))?.name).toBe('New Name');
    });

    it('throws NotFoundError for a missing id', async () => {
      await expect(
        service.update('missing', { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationFailedError for a bad patch', async () => {
      const created = await service.create(validInput());
      await expect(
        service.update(created.id, { version: 'not-semver' }),
      ).rejects.toBeInstanceOf(ValidationFailedError);
    });

    it('throws ValidationFailedError for an empty patch', async () => {
      const created = await service.create(validInput());
      await expect(service.update(created.id, {})).rejects.toBeInstanceOf(
        ValidationFailedError,
      );
    });
  });

  describe('remove', () => {
    it('removes an existing record', async () => {
      const created = await service.create(validInput());
      await service.remove(created.id);
      await expect(service.get(created.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when the record is absent', async () => {
      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
