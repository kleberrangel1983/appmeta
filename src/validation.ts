import { PLATFORMS } from './types.js';
import type {
  CreateMetadataInput,
  UpdateMetadataInput,
  ValidationResult,
  ValidationError,
} from './types.js';

const VERSION_RE = /^\d+\.\d+\.\d+$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate the `name` field. Pushes at most one error. */
function checkName(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
    return;
  }
  const len = value.trim().length;
  if (len < 1 || len > 100) {
    errors.push({
      field: 'name',
      message: 'name must be between 1 and 100 characters',
    });
  }
}

/** Validate the `platform` field. Pushes at most one error. */
function checkPlatform(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string' || !PLATFORMS.includes(value as never)) {
    errors.push({
      field: 'platform',
      message: `platform must be one of: ${PLATFORMS.join(', ')}`,
    });
  }
}

/** Validate the `version` field. Pushes at most one error. */
function checkVersion(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string') {
    errors.push({ field: 'version', message: 'version must be a string' });
    return;
  }
  if (!VERSION_RE.test(value)) {
    errors.push({
      field: 'version',
      message: 'version must match the format X.Y.Z',
    });
  }
}

/** Validate the optional `description` field. Pushes at most one error. */
function checkDescription(value: unknown, errors: ValidationError[]): void {
  if (typeof value !== 'string') {
    errors.push({
      field: 'description',
      message: 'description must be a string',
    });
    return;
  }
  if (value.length > 500) {
    errors.push({
      field: 'description',
      message: 'description must be at most 500 characters',
    });
  }
}

/** Validate the optional `tags` field. Pushes at most one error. */
function checkTags(value: unknown, errors: ValidationError[]): void {
  if (!Array.isArray(value)) {
    errors.push({ field: 'tags', message: 'tags must be an array' });
    return;
  }
  if (value.length > 20) {
    errors.push({ field: 'tags', message: 'tags must contain at most 20 items' });
    return;
  }
  for (const tag of value) {
    if (typeof tag !== 'string' || tag.length < 1) {
      errors.push({
        field: 'tags',
        message: 'each tag must be a non-empty string',
      });
      return;
    }
    if (tag.length > 30) {
      errors.push({
        field: 'tags',
        message: 'each tag must be at most 30 characters',
      });
      return;
    }
  }
}

/**
 * Validate a create payload.
 *
 * Rules (enforce all of these):
 * - name: required, string, trimmed length 1..100
 * - platform: required, one of PLATFORMS ('ios' | 'android' | 'web')
 * - version: required, string matching semver-like /^\d+\.\d+\.\d+$/
 * - description: optional, string, max length 500
 * - tags: optional, array of non-empty strings, max 20 tags, each <= 30 chars
 *
 * Return { valid: false, errors: [...] } with one entry per failing field,
 * or { valid: true, errors: [] } when everything passes.
 */
export function validateCreate(input: unknown): ValidationResult {
  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [{ field: 'input', message: 'input must be an object' }],
    };
  }

  const errors: ValidationError[] = [];

  checkName(input.name, errors);
  checkPlatform(input.platform, errors);
  checkVersion(input.version, errors);

  if (input.description !== undefined) {
    checkDescription(input.description, errors);
  }
  if (input.tags !== undefined) {
    checkTags(input.tags, errors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an update payload. Same per-field rules as validateCreate, but
 * every field is optional. An empty object is INVALID (at least one field
 * must be provided). Unknown/invalid types for a provided field are errors.
 */
export function validateUpdate(input: unknown): ValidationResult {
  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [{ field: 'input', message: 'input must be an object' }],
    };
  }

  const errors: ValidationError[] = [];

  const hasName = input.name !== undefined;
  const hasPlatform = input.platform !== undefined;
  const hasVersion = input.version !== undefined;
  const hasDescription = input.description !== undefined;
  const hasTags = input.tags !== undefined;

  if (!hasName && !hasPlatform && !hasVersion && !hasDescription && !hasTags) {
    return {
      valid: false,
      errors: [
        { field: 'input', message: 'at least one field must be provided' },
      ],
    };
  }

  if (hasName) {
    checkName(input.name, errors);
  }
  if (hasPlatform) {
    checkPlatform(input.platform, errors);
  }
  if (hasVersion) {
    checkVersion(input.version, errors);
  }
  if (hasDescription) {
    checkDescription(input.description, errors);
  }
  if (hasTags) {
    checkTags(input.tags, errors);
  }

  return { valid: errors.length === 0, errors };
}

// Re-exported for convenience in tests.
export type { CreateMetadataInput, UpdateMetadataInput };
