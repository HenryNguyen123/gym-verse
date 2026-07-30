import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const UploadFileInterceptor = (fieldName: string, path: string) =>
  FileInterceptor(fieldName, {
    storage: diskStorage({
      destination: path,
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file) {
        return cb(null, true);
      }
      if (!file.mimetype.startsWith('image/')) {
        return cb(
          new BadRequestException('Only image files are allowed'),
          false,
        );
      }
      cb(null, true);
    },
  });
