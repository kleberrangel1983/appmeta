import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { MetadataService } from '../src/service.js';
import type { AppMetadata } from '../src/types.js';
import { ValidationFailedError, NotFoundError } from '../src/types.js';

/**
 * These tests exercise the HTTP layer IN ISOLATION. The service is a fake
 * object (vitest mock functions) that satisfies the MetadataService shape,
 * cast via `as unknown as MetadataService`. No real service/repository is
 * imported or instantiated, so the tests do not depend on teammate work.
 */

interface FakeService {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

const sampleRecord: AppMetadata = {
  id: 'rec-1',
  name: 'My App',
  platform: 'ios',
  version: '1.0.0',
  description: 'demo',
  tags: ['foo'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makeFake(): FakeService {
  return {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

function appFor(fake: FakeService) {
  return createApp(fake as unknown as MetadataService);
}

describe('HTTP API layer', () => {
  let fake: FakeService;

  beforeEach(() => {
    fake = makeFake();
  });

  describe('GET /health', () => {
    it('returns 200 { status: "ok" }', async () => {
      const res = await request(appFor(fake)).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /metadata', () => {
    it('returns 201 with the created record and forwards the body to create', async () => {
      fake.create.mockResolvedValue(sampleRecord);
      const payload = {
        name: 'My App',
        platform: 'ios',
        version: '1.0.0',
        description: 'demo',
        tags: ['foo'],
      };

      const res = await request(appFor(fake)).post('/metadata').send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(sampleRecord);
      expect(fake.create).toHaveBeenCalledTimes(1);
      expect(fake.create).toHaveBeenCalledWith(payload);
    });

    it('maps ValidationFailedError to 400 { errors }', async () => {
      const errors = [{ field: 'name', message: 'required' }];
      fake.create.mockRejectedValue(new ValidationFailedError(errors));

      const res = await request(appFor(fake)).post('/metadata').send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors });
    });
  });

  describe('GET /metadata', () => {
    it('returns 200 with the array from list', async () => {
      fake.list.mockResolvedValue([sampleRecord]);

      const res = await request(appFor(fake)).get('/metadata');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([sampleRecord]);
    });

    it('passes ?platform & ?tag through to list as a filter', async () => {
      fake.list.mockResolvedValue([]);

      const res = await request(appFor(fake)).get(
        '/metadata?platform=ios&tag=foo',
      );

      expect(res.status).toBe(200);
      expect(fake.list).toHaveBeenCalledWith({ platform: 'ios', tag: 'foo' });
    });
  });

  describe('GET /metadata/:id', () => {
    it('returns 200 with the record', async () => {
      fake.get.mockResolvedValue(sampleRecord);

      const res = await request(appFor(fake)).get('/metadata/rec-1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(sampleRecord);
      expect(fake.get).toHaveBeenCalledWith('rec-1');
    });

    it('maps NotFoundError to 404 { error }', async () => {
      const err = new NotFoundError('missing');
      fake.get.mockRejectedValue(err);

      const res = await request(appFor(fake)).get('/metadata/missing');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: err.message });
    });
  });

  describe('PATCH /metadata/:id', () => {
    it('returns 200 with the updated record', async () => {
      const updated = { ...sampleRecord, name: 'Renamed' };
      fake.update.mockResolvedValue(updated);
      const patch = { name: 'Renamed' };

      const res = await request(appFor(fake))
        .patch('/metadata/rec-1')
        .send(patch);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(fake.update).toHaveBeenCalledWith('rec-1', patch);
    });

    it('maps ValidationFailedError to 400 { errors }', async () => {
      const errors = [{ field: 'version', message: 'invalid' }];
      fake.update.mockRejectedValue(new ValidationFailedError(errors));

      const res = await request(appFor(fake))
        .patch('/metadata/rec-1')
        .send({ version: '' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors });
    });

    it('maps NotFoundError to 404 { error }', async () => {
      const err = new NotFoundError('missing');
      fake.update.mockRejectedValue(err);

      const res = await request(appFor(fake))
        .patch('/metadata/missing')
        .send({ name: 'x' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: err.message });
    });
  });

  describe('DELETE /metadata/:id', () => {
    it('returns 204 with an empty body', async () => {
      fake.remove.mockResolvedValue(undefined);

      const res = await request(appFor(fake)).delete('/metadata/rec-1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(res.text).toBe('');
      expect(fake.remove).toHaveBeenCalledWith('rec-1');
    });

    it('maps NotFoundError to 404 { error }', async () => {
      const err = new NotFoundError('missing');
      fake.remove.mockRejectedValue(err);

      const res = await request(appFor(fake)).delete('/metadata/missing');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: err.message });
    });
  });

  describe('unexpected errors', () => {
    it('maps an unknown error to 500 { error: "Internal server error" }', async () => {
      fake.get.mockRejectedValue(new Error('boom'));

      const res = await request(appFor(fake)).get('/metadata/rec-1');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });
});
