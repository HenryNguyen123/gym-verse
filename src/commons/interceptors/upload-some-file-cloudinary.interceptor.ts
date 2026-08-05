import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export interface UploadField {
  name: string;
  maxCount?: number;
}

export function UploadSomeFilesCloudinaryInterceptor(fields: UploadField[]) {
  return FileFieldsInterceptor(fields, {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 10,
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);
      }

      cb(null, true);
    },
  });
}
