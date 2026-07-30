import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const Permissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSION_KEY, permissions);
};
