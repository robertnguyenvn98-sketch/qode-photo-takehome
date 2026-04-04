import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertSupportedImageMimeType } from './upload-validation';

describe('upload validation unit', () => {
  it('accepts JPEG, PNG and WEBP', () => {
    expect(() => assertSupportedImageMimeType('image/jpeg')).not.toThrow();
    expect(() => assertSupportedImageMimeType('image/png')).not.toThrow();
    expect(() => assertSupportedImageMimeType('image/webp')).not.toThrow();
  });

  it('rejects unsupported MIME types', () => {
    expect(() => assertSupportedImageMimeType('image/gif')).toThrow(BadRequestException);
  });
});
