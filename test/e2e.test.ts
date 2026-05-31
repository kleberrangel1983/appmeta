import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { InMemoryMetadataRepository } from '../src/repository.js';
import { MetadataService } from '../src/service.js';

/**
 * End-to-end tests exercising the full real stack: HTTP layer -> service ->
 * in-memory repository, with no test doubles. This is the integration seam
 * that the per-layer unit tests do not cover.
 */
describe('appmeta end-to-end', () => {
  let app: ReturnType<typeof createApp>;
  let repo: InMemoryMetadataRepository;

  beforeEach(() => {
    repo = new InMemoryMetadataRepository();
    app = createApp(new MetadataService(repo));
  });

  const sample = {
    name: 'Photos',
    platform: 'ios' as const,
    version: '1.2.3',
    description: 'A photo app',
    tags: ['media', 'camera'],
  };

  it('runs a full create -> read -> update -> delete lifecycle', async () => {
    // Create
    const created = await request(app).post('/metadata').send(sample);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(sample);
    expect(created.body.id).toBeTypeOf('string');
    expect(created.body.createdAt).toBe(created.body.updatedAt);
    const { id } = created.body;

    // Read one
    const fetched = await request(app).get(`/metadata/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(id);

    // Update
    const updated = await request(app)
      .patch(`/metadata/${id}`)
      .send({ version: '2.0.0' });
    expect(updated.status).toBe(200);
    expect(updated.body.version).toBe('2.0.0');
    expect(updated.body.name).toBe('Photos');

    // Delete
    const deleted = await request(app).delete(`/metadata/${id}`);
    expect(deleted.status).toBe(204);

    // Gone
    const gone = await request(app).get(`/metadata/${id}`);
    expect(gone.status).toBe(404);
  });

  it('returns 400 with field errors for an invalid create', async () => {
    const res = await request(app)
      .post('/metadata')
      .send({ name: '', platform: 'symbian', version: 'not-semver' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('platform');
    expect(fields).toContain('version');
  });

  it('filters the listing by platform and tag', async () => {
    await request(app)
      .post('/metadata')
      .send({ name: 'iOS App', platform: 'ios', version: '1.0.0', tags: ['games'] });
    await request(app)
      .post('/metadata')
      .send({ name: 'Android App', platform: 'android', version: '1.0.0', tags: ['games'] });
    await request(app)
      .post('/metadata')
      .send({ name: 'Web App', platform: 'web', version: '1.0.0', tags: ['tools'] });

    const all = await request(app).get('/metadata');
    expect(all.body).toHaveLength(3);

    const ios = await request(app).get('/metadata?platform=ios');
    expect(ios.body).toHaveLength(1);
    expect(ios.body[0].name).toBe('iOS App');

    const games = await request(app).get('/metadata?tag=games');
    expect(games.body).toHaveLength(2);

    const iosGames = await request(app).get('/metadata?platform=ios&tag=games');
    expect(iosGames.body).toHaveLength(1);
  });

  it('returns 404 when deleting a record that does not exist', async () => {
    const res = await request(app).delete('/metadata/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('does-not-exist');
  });

  it('reports health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('surfaces 404 if a record is deleted concurrently mid-update', async () => {
    // The record exists at findById time but vanishes before update persists
    // (e.g. a concurrent delete). The service must still report NotFound.
    const created = await repo.create({
      id: 'race-1',
      name: 'Race',
      platform: 'web',
      version: '1.0.0',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const service = new MetadataService(repo);
    const original = repo.update.bind(repo);
    // Force the persist step to behave as if the row disappeared.
    repo.update = async () => null;
    await expect(service.update(created.id, { version: '2.0.0' })).rejects.toThrow(
      /not found/i,
    );
    repo.update = original;
  });
});
