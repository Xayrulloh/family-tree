/// <reference types="jest" />
import { type ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { HttpExceptionFilter } from './http.filter';

function makeHost(): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }),
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let superCatchSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    superCatchSpy = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => {});

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('delegates a plain HttpException to the base filter without logging', () => {
    const exception = new HttpException('Not Found', 404);
    const host = makeHost();

    filter.catch(exception, host);

    expect(superCatchSpy).toHaveBeenCalledWith(exception, host);
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('logs the zod error message for a ZodSerializationException, then delegates', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['name'],
        message: 'Required',
      } as never,
    ]);

    const exception = new ZodSerializationException(zodError);
    const host = makeHost();

    filter.catch(exception, host);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ZodSerializationException:'),
    );

    expect(superCatchSpy).toHaveBeenCalledWith(exception, host);
  });
});
