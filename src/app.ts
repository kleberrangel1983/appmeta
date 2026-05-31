import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { MetadataService } from './service.js';
import type { ListFilter, Platform } from './types.js';
import { ValidationFailedError, NotFoundError } from './types.js';

/**
 * Build the Express app wired to a MetadataService.
 *
 * Routes to expose (all JSON):
 * - GET    /health              -> 200 { status: 'ok' }
 * - POST   /metadata            -> 201 created record | 400 { errors }
 * - GET    /metadata            -> 200 record[] (supports ?platform= & ?tag=)
 * - GET    /metadata/:id        -> 200 record | 404 { error }
 * - PATCH  /metadata/:id        -> 200 updated record | 400 { errors } | 404
 * - DELETE /metadata/:id        -> 204 no content | 404 { error }
 *
 * Error mapping:
 * - ValidationFailedError -> 400 { errors: ValidationError[] }
 * - NotFoundError         -> 404 { error: string }
 * - anything else         -> 500 { error: 'Internal server error' }
 */

/** Wrap an async handler so rejected promises reach the error middleware. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function createApp(service: MetadataService): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post(
    '/metadata',
    asyncHandler(async (req, res) => {
      const created = await service.create(req.body);
      res.status(201).json(created);
    }),
  );

  app.get(
    '/metadata',
    asyncHandler(async (req, res) => {
      const filter: ListFilter = {};
      if (typeof req.query.platform === 'string') {
        filter.platform = req.query.platform as Platform;
      }
      if (typeof req.query.tag === 'string') {
        filter.tag = req.query.tag;
      }
      const records = await service.list(filter);
      res.status(200).json(records);
    }),
  );

  app.get(
    '/metadata/:id',
    asyncHandler(async (req, res) => {
      const record = await service.get(req.params.id);
      res.status(200).json(record);
    }),
  );

  app.patch(
    '/metadata/:id',
    asyncHandler(async (req, res) => {
      const updated = await service.update(req.params.id, req.body);
      res.status(200).json(updated);
    }),
  );

  app.delete(
    '/metadata/:id',
    asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(204).end();
    }),
  );

  // Centralized error-handling middleware.
  app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
      if (err instanceof ValidationFailedError) {
        res.status(400).json({ errors: err.errors });
        return;
      }
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
