import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(_: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err: unknown, _: Request, res: Response, __: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request payload',
      details: err.issues,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = message.toLowerCase().includes('shortlist') ? 400 : 500;
  res.status(status).json({ error: message });
}
