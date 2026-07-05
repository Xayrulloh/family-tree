import { FileUploadFolderEnum } from '@family-tree/shared';
import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { file } from './file';

describe('file api client (integration)', () => {
  it('upload → POST /files/:category as multipart form data', async () => {
    const rec = recordRequest({ path: 'x', message: 'ok' });
    const form = new FormData();

    form.append('file', new Blob(['data']), 'avatar.png');

    await file.upload(FileUploadFolderEnum.AVATAR, form);

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/files/avatar');
    expect(rec.contentType).toMatch(/multipart\/form-data/);
  });

  it('delete → DELETE /files/:category/:key', async () => {
    const rec = recordRequest({ message: 'ok' });

    await file.delete(FileUploadFolderEnum.TREE, 'image-key.png');

    expect(rec.method).toBe('DELETE');
    expect(rec.pathname).toBe('/files/tree/image-key.png');
  });
});
