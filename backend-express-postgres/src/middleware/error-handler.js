import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  if (error.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
