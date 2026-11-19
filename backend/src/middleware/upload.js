import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sniffAudio } from '../utils/audio.js';

const ALLOWED_CLIENT_MIME = /^(audio\/(webm|ogg|wav|x-wav|wave|mpeg|mp3|mp4|m4a|x-m4a)|video\/(webm|mp4))(;.*)?$/;

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_AUDIO_MB * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_CLIENT_MIME.test(file.mimetype)) return cb(new AppError(415, 'Unsupported audio format', 'BAD_AUDIO'));
    cb(null, true);
  },
}).single('audio');

// Second line of defence: verify actual file contents.
export function verifyAudioContents(req, _res, next) {
  if (!req.file) return next(new AppError(400, 'Audio file is required', 'NO_AUDIO'));
  const kind = sniffAudio(req.file.buffer);
  if (!kind) return next(new AppError(415, 'File contents are not a supported audio format', 'BAD_AUDIO'));
  if (req.file.size < 1024) return next(new AppError(400, 'Recording is too short', 'BAD_AUDIO'));
  req.audioKind = kind;
  next();
}
