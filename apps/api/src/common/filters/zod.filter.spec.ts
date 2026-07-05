/// <reference types="jest" />
import type { ArgumentsHost } from '@nestjs/common';
import type { ZodValidationException } from 'nestjs-zod';
import { ZodValidationExceptionFilter } from './zod.filter';

function makeIssue(
  path: string[],
  message: string,
  code: string,
): { path: string[]; message: string; code: string } {
  return { path, message, code };
}

function makeException(
  issues: ReturnType<typeof makeIssue>[],
): ZodValidationException {
  return {
    getZodError: () => ({ issues }),
  } as unknown as ZodValidationException;
}

function makeHost(statusMock: jest.Mock, jsonMock: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status: statusMock, json: jsonMock }),
    }),
  } as unknown as ArgumentsHost;
}

describe('ZodValidationExceptionFilter', () => {
  let filter: ZodValidationExceptionFilter;

  beforeEach(() => {
    filter = new ZodValidationExceptionFilter();
  });

  it('always responds with status 400', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      makeException([makeIssue(['name'], 'Required', 'invalid_type')]),
      makeHost(status, json),
    );

    expect(status).toHaveBeenCalledWith(400);
  });

  it('sets statusCode, message, and errors in the response body', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      makeException([makeIssue(['name'], 'Required', 'invalid_type')]),
      makeHost(status, json),
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Validation failed',
      errors: [{ path: 'name', message: 'Required', code: 'invalid_type' }],
    });
  });

  it('joins nested path segments with a dot', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      makeException([
        makeIssue(['user', 'email'], 'Invalid email', 'invalid_string'),
      ]),
      makeHost(status, json),
    );

    const [body] = json.mock.calls[0];

    expect(body.errors[0].path).toBe('user.email');
  });

  it('handles multiple issues in a single response', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      makeException([
        makeIssue(['name'], 'Required', 'invalid_type'),
        makeIssue(['email'], 'Invalid email', 'invalid_string'),
      ]),
      makeHost(status, json),
    );

    const [body] = json.mock.calls[0];

    expect(body.errors).toHaveLength(2);
    expect(body.errors[1].path).toBe('email');
  });

  it('produces an empty errors array when there are no issues', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(makeException([]), makeHost(status, json));

    const [body] = json.mock.calls[0];

    expect(body.errors).toEqual([]);
  });

  it('uses an empty string for a top-level path', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    filter.catch(
      makeException([makeIssue([], 'Invalid', 'custom')]),
      makeHost(status, json),
    );

    const [body] = json.mock.calls[0];

    expect(body.errors[0].path).toBe('');
  });
});
