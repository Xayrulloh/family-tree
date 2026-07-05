import { describe, expect, it } from 'vitest';
import { FileUploadResponseSchema } from './upload.response';

describe('FileUploadResponseSchema', () => {
  it('accepts a message and a path', () => {
    expect(
      FileUploadResponseSchema.safeParse({
        message: 'Uploaded',
        path: 'https://cdn.example.com/avatar/a.png',
      }).success,
    ).toBe(true);
  });

  it('rejects an empty message', () => {
    expect(
      FileUploadResponseSchema.safeParse({ message: '', path: 'x' }).success,
    ).toBe(false);
  });

  it('rejects an empty path', () => {
    expect(
      FileUploadResponseSchema.safeParse({ message: 'ok', path: '' }).success,
    ).toBe(false);
  });
});
