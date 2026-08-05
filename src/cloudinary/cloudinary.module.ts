import { Module } from '@nestjs/common';
import { CloudinaryProvider } from 'src/cloudinary/provider/cloudinary.provider';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
