import type {
  AppMetadata,
  ListFilter,
  MetadataRepository,
} from './types.js';

/**
 * In-memory implementation of MetadataRepository.
 *
 * Behaviour contract:
 * - create: stores a copy of the record, returns the stored record.
 * - findById: returns a copy of the record or null.
 * - list: returns copies of all records; when filter.platform is set, only
 *   records of that platform; when filter.tag is set, only records whose
 *   tags include it. Both filters combine (AND). Order: insertion order.
 * - update: replaces the record at id, returns the stored record, or null
 *   if no record exists for id.
 * - delete: removes the record, returns true if it existed, else false.
 * - clear: removes everything (test helper).
 *
 * Records must be stored defensively (no shared references leaking in/out),
 * so callers cannot mutate internal state.
 */
export class InMemoryMetadataRepository implements MetadataRepository {
  private readonly store = new Map<string, AppMetadata>();

  private clone(record: AppMetadata): AppMetadata {
    return { ...record, tags: [...record.tags] };
  }

  async create(record: AppMetadata): Promise<AppMetadata> {
    this.store.set(record.id, this.clone(record));
    return this.clone(record);
  }

  async findById(id: string): Promise<AppMetadata | null> {
    const found = this.store.get(id);
    return found ? this.clone(found) : null;
  }

  async list(filter?: ListFilter): Promise<AppMetadata[]> {
    const results: AppMetadata[] = [];
    for (const record of this.store.values()) {
      if (filter?.platform !== undefined && record.platform !== filter.platform) {
        continue;
      }
      if (filter?.tag !== undefined && !record.tags.includes(filter.tag)) {
        continue;
      }
      results.push(this.clone(record));
    }
    return results;
  }

  async update(id: string, record: AppMetadata): Promise<AppMetadata | null> {
    if (!this.store.has(id)) {
      return null;
    }
    this.store.set(id, this.clone(record));
    return this.clone(record);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
