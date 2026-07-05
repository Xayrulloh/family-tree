import type { AxiosError, AxiosResponse } from 'axios';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { errorFx, successFx } from '~/shared/lib/message';
import {
  type ApiErrorResponse,
  onResponseError,
  onResponseSuccess,
} from './base';

const handler = { fulfilled: onResponseSuccess, rejected: onResponseError };

const makeResponse = (method: string, url = '/family-trees'): AxiosResponse =>
  ({ config: { method, url }, data: {} }) as AxiosResponse;

const makeError = (
  data: unknown,
  message = 'Request failed',
): AxiosError<ApiErrorResponse> =>
  ({ response: { data }, message }) as AxiosError<ApiErrorResponse>;

describe('base response interceptor', () => {
  const successCalls: unknown[] = [];
  const errorCalls: unknown[] = [];

  const unSubSuccess = successFx.watch((payload) => successCalls.push(payload));
  const unSubError = errorFx.watch((payload) => errorCalls.push(payload));

  afterEach(() => {
    successCalls.length = 0;
    errorCalls.length = 0;
  });

  afterAll(() => {
    unSubSuccess();
    unSubError();
  });

  describe('success toasts', () => {
    it.each([
      ['post', 'Created successfully'],
      ['put', 'Updated successfully'],
      ['patch', 'Updated successfully'],
      ['delete', 'Deleted successfully'],
    ])('shows a toast for %s requests', (method, expected) => {
      handler.fulfilled(makeResponse(method));

      expect(successCalls).toEqual([expected]);
    });

    it('shows no toast for GET requests', () => {
      handler.fulfilled(makeResponse('get'));

      expect(successCalls).toHaveLength(0);
    });

    it('shows no toast for file uploads', () => {
      handler.fulfilled(makeResponse('post', '/files/avatar'));

      expect(successCalls).toHaveLength(0);
    });

    it('returns the response unchanged', () => {
      const response = makeResponse('get');

      expect(handler.fulfilled(response)).toBe(response);
    });
  });

  describe('error toasts', () => {
    it('rejects 401 silently — no toast, auth redirect handled elsewhere', async () => {
      const error = makeError({ statusCode: 401, message: 'Unauthorized' });

      await expect(handler.rejected(error)).rejects.toBe(error);

      expect(errorCalls).toHaveLength(0);
    });

    it('joins field validation errors into one message', async () => {
      const error = makeError({
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          { path: 'name', message: 'Too short', code: 'too_small' },
          { path: 'image', message: 'Invalid url', code: 'invalid_string' },
        ],
      });

      await expect(handler.rejected(error)).rejects.toBe(error);

      expect(errorCalls).toEqual(['name: Too short\nimage: Invalid url']);
    });

    it('falls back to the server message when there are no field errors', async () => {
      const error = makeError({ statusCode: 404, message: 'Tree not found' });

      await expect(handler.rejected(error)).rejects.toBe(error);

      expect(errorCalls).toEqual(['Tree not found']);
    });

    it('falls back to the axios message when there is no response body', async () => {
      const error = {
        message: 'Network Error',
      } as AxiosError<ApiErrorResponse>;

      await expect(handler.rejected(error)).rejects.toBe(error);

      expect(errorCalls).toEqual(['Network Error']);
    });
  });
});
