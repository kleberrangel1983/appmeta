/**
 * Core domain types and contracts for the appmeta API.
 *
 * These definitions are the shared contract every layer (validation,
 * repository, service, HTTP) implements against. Keep them framework-agnostic.
 */

export type Platform = 'ios' | 'android' | 'web';

export const PLATFORMS: readonly Platform[] = ['ios', 'android', 'web'];

/** A fully persisted app metadata record. */
export interface AppMetadata {
  id: string;
  name: string;
  platform: Platform;
  version: string;
  description?: string;
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Payload accepted when creating a record (server assigns id/timestamps). */
export interface CreateMetadataInput {
  name: string;
  platform: Platform;
  version: string;
  description?: string;
  tags?: string[];
}

/** Payload accepted when updating a record. All fields optional. */
export interface UpdateMetadataInput {
  name?: string;
  platform?: Platform;
  version?: string;
  description?: string;
  tags?: string[];
}

/** Filters supported by list queries. */
export interface ListFilter {
  platform?: Platform;
  tag?: string;
}

/** A single field-level validation problem. */
export interface ValidationError {
  field: string;
  message: string;
}

/** Result returned by validation functions. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Thrown by the service layer when an input fails validation.
 * The HTTP layer maps this to a 400 response.
 */
export class ValidationFailedError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationFailedError';
  }
}

/**
 * Thrown by the service layer when a record does not exist.
 * The HTTP layer maps this to a 404 response.
 */
export class NotFoundError extends Error {
  constructor(id: string) {
    super(`Metadata record not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

/** Persistence contract. Implemented by InMemoryMetadataRepository. */
export interface MetadataRepository {
  create(record: AppMetadata): Promise<AppMetadata>;
  findById(id: string): Promise<AppMetadata | null>;
  list(filter?: ListFilter): Promise<AppMetadata[]>;
  update(id: string, record: AppMetadata): Promise<AppMetadata | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}
