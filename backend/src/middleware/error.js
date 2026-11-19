import { ZodError } from 'zod';
import multer from 'multer';
import { logger } from '../utils/logger.js';

export const notFound = (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten().fieldErrors } });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Audio file is too large' : 'Upload failed';
    return res.status(413).json({ error: { code: 'UPLOAD', message: msg } });
  }
  if (err?.name === 'CastError') return res.status(400).json({ error: { code: 'BAD_ID', message: 'Invalid identifier' } });
  if (err?.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Resource already exists' } });
  if (err?.expose) {
    return res.status(err.status || 400).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  logger.error({ err: err?.message, stack: err?.stack, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
}
