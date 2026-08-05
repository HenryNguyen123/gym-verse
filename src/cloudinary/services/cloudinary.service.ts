import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  async uploadFileCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        {
          folder: 'gymverse',
        },
        (error, result) => {
          if (error) return reject(new Error(error.message));
          resolve(result!);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  async uploadSomeFilesCloudinary(
    files: Express.Multer.File[],
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map(
      (file) =>
        new Promise<UploadApiResponse>((resolve, reject) => {
          const upload = this.cloudinary.uploader.upload_stream(
            {
              folder: 'gymverse',
            },
            (error, result) => {
              if (error) {
                return reject(new Error(error.message));
              }

              if (!result) {
                return reject(new Error('Upload failed'));
              }

              resolve(result);
            },
          );

          Readable.from(file.buffer).pipe(upload);
        }),
    );

    return Promise.all(uploadPromises);
  }
}
