import { Module } from '@nestjs/common';
import { CloudinaryController } from 'src/cloudinary/controllers/cloudinary.controller';
import { CloudinaryProvider } from 'src/cloudinary/provider/cloudinary.provider';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';

@Module({
  imports: [],
  controllers: [CloudinaryController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
