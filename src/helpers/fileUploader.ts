import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomBytes } from 'crypto';
import config from '../config';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ensureUploadDir = (): void => {
  const dir = path.resolve(process.cwd(), config.upload.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, path.resolve(process.cwd(), config.upload.path));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

export const fileUploader = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

export const getPhotoUrl = (filename?: string): string | null => {
  if (!filename) return null;
  return `/${config.upload.path}/${filename}`;
};
