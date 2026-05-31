import { validateCreate, validateUpdate } from './validation.js';
import {
  NotFoundError,
  ValidationFailedError,
} from './types.js';
import type {
  AppMetadata,
  CreateMetadataInput,
  ListFilter,
  MetadataRepository,
  UpdateMetadataInput,
} from './types.js';

/**
 * Business logic for app metadata. Orchestrates validation + persistence.
 *
 * The service is constructed with a repository (dependency injection) so it
 * can be tested against the in-memory repo and run in production against any
 * other MetadataRepository implementation.
 *
 * Behaviour contract:
 * - create: validate input (throw ValidationFailedError on failure), assign a
 *   fresh id (crypto.randomUUID) and createdAt/updatedAt timestamps, default
 *   tags to [], persist, return the record.
 * - get: return the record or throw NotFoundError.
 * - list: pass filter through to the repository.
 * - update: validate patch (throw ValidationFailedError), load existing record
 *   (throw NotFoundError if missing), merge provided fields, bump updatedAt,
 *   persist, return updated record.
 * - remove: delete by id, throw NotFoundError if it did not exist.
 */
export class MetadataService {
  constructor(private readonly repo: MetadataRepository) {}

  async create(input: CreateMetadataInput): Promise<AppMetadata> {
    const result = validateCreate(input);
    if (!result.valid) {
      throw new ValidationFailedError(result.errors);
    }

    const now = new Date().toISOString();
    const record: AppMetadata = {
      id: crypto.randomUUID(),
      name: input.name,
      platform: input.platform,
      version: input.version,
      tags: input.tags ? [...input.tags] : [],
      createdAt: now,
      updatedAt: now,
    };
    if (input.description !== undefined) {
      record.description = input.description;
    }

    return this.repo.create(record);
  }

  async get(id: string): Promise<AppMetadata> {
    const record = await this.repo.findById(id);
    if (record === null) {
      throw new NotFoundError(id);
    }
    return record;
  }

  async list(filter?: ListFilter): Promise<AppMetadata[]> {
    return this.repo.list(filter);
  }

  async update(id: string, patch: UpdateMetadataInput): Promise<AppMetadata> {
    const result = validateUpdate(patch);
    if (!result.valid) {
      throw new ValidationFailedError(result.errors);
    }

    const existing = await this.repo.findById(id);
    if (existing === null) {
      throw new NotFoundError(id);
    }

    const updated: AppMetadata = { ...existing };
    if (patch.name !== undefined) updated.name = patch.name;
    if (patch.platform !== undefined) updated.platform = patch.platform;
    if (patch.version !== undefined) updated.version = patch.version;
    if (patch.description !== undefined) updated.description = patch.description;
    if (patch.tags !== undefined) updated.tags = [...patch.tags];
    updated.updatedAt = new Date().toISOString();

    const persisted = await this.repo.update(id, updated);
    if (persisted === null) {
      throw new NotFoundError(id);
    }
    return persisted;
  }

  async remove(id: string): Promise<void> {
    const existed = await this.repo.delete(id);
    if (!existed) {
      throw new NotFoundError(id);
    }
  }
}
