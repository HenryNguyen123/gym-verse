import { BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export interface UploadField {
  name: string;
  destination: string;
  maxCount?: number;
}

export const UploadSomeFilesInterceptor = (fields: UploadField[]) =>
  FileFieldsInterceptor(
    fields.map((field) => ({
      name: field.name,
      maxCount: field.maxCount ?? 1,
    })),
    {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const currentField = fields.find((f) => f.name === file.fieldname);

          if (!currentField) {
            return cb(new BadRequestException('Invalid upload field'), '');
          }

          cb(null, currentField.destination);
        },

        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

          cb(null, uniqueName + extname(file.originalname));
        },
      }),

      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }

        cb(null, true);
      },
    },
  );
