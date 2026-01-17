import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { BadRequestError } from '../utils/errors.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

const documentFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid document type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`));
  }
};

const anyFileFilter = (
  _req: Express.Request,
  _file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export const uploadAny = multer({
  storage,
  fileFilter: anyFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Specific upload handlers
export const uploadVehiclePhotos = uploadImage.array('photos', 10);
export const uploadAvatar = uploadImage.single('avatar');
export const uploadSingleDocument = uploadDocument.single('document');
export const uploadMultipleDocuments = uploadDocument.array('documents', 5);
