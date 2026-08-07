import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import 'dotenv/config';

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
  // get signature
  getSignature() {
    const timestamp = Math.round(Date.now() / 100);
    const signature = this.cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: 'gymverse',
      },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: 'gymverse',
    };
  }
}
