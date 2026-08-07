import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';

@ApiTags('cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}
  @Post('signature')
  getSignature() {
    return this.cloudinaryService.getSignature();
  }
}
