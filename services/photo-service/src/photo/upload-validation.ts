import { BadRequestException } from '@nestjs/common';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function assertSupportedImageMimeType(mimeType: string) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestException('Unsupported file type');
  }
}
