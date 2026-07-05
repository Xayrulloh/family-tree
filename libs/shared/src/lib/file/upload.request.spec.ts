import { describe, expect, it } from 'vitest';
import { FileUploadFolderEnum, FileUploadParamSchema } from './upload.request';

describe('FileUploadParamSchema', () => {
  it.each([
    FileUploadFolderEnum.AVATAR,
    FileUploadFolderEnum.TREE,
    FileUploadFolderEnum.TREE_MEMBER,
  ])('accepts folder %s', (folder) => {
    expect(FileUploadParamSchema.safeParse({ folder }).success).toBe(true);
  });

  it('rejects an unknown folder — prevents arbitrary R2 paths', () => {
    expect(
      FileUploadParamSchema.safeParse({ folder: '../../etc' }).success,
    ).toBe(false);
  });

  it('rejects a missing folder', () => {
    expect(FileUploadParamSchema.safeParse({}).success).toBe(false);
  });
});
