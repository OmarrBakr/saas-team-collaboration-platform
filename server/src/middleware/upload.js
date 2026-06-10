const multer = require('multer');
const { BadRequestError } = require('../errors');

const createUpload = ({ allowedTypes, maxSize, errorMessage }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }

      cb(new BadRequestError(errorMessage));
    },
  });

const logoUpload = createUpload({
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSize: 2 * 1024 * 1024,
  errorMessage: 'Only JPEG, PNG, WebP, and GIF images are allowed',
});

const attachmentUpload = createUpload({
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/json',
    'application/xml',
  ],
  maxSize: 25 * 1024 * 1024,
  errorMessage:
    'This file type is not supported for attachments',
});

module.exports = {
  logoUpload,
  attachmentUpload,
};
