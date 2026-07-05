/// <reference types="jest" />
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { ZodSerializerInterceptorCustom } from './zod.response.interceptor';

jest.mock('nestjs-zod', () => ({
  validate: jest.fn((res: unknown) => res),
  ZodSerializationException: class ZodSerializationException extends Error {},
}));

const { validate } = jest.requireMock('nestjs-zod') as { validate: jest.Mock };

function makeContext(
  handlerSchema?: object,
  classSchema?: object,
): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue(handlerSchema),
    getClass: jest.fn().mockReturnValue(classSchema),
  } as unknown as ExecutionContext;
}

function makeNext(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe('ZodSerializerInterceptorCustom', () => {
  let reflector: Reflector;
  let interceptor: ZodSerializerInterceptorCustom;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = new Reflector();
    interceptor = new ZodSerializerInterceptorCustom(reflector);
  });

  it('passes the response through unchanged when no schema is registered', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const payload = { id: '1' };

    interceptor
      .intercept(makeContext(), makeNext(payload))
      .subscribe((result) => {
        expect(validate).not.toHaveBeenCalled();
        expect(result).toBe(payload);
        done();
      });
  });

  it('calls validate with the response when a schema is registered', (done) => {
    const mockSchema = {};

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(mockSchema);
    validate.mockReturnValue({ validated: true });

    interceptor
      .intercept(makeContext(), makeNext({ id: '1' }))
      .subscribe((result) => {
        expect(result).toEqual({ validated: true });
        expect(validate).toHaveBeenCalledWith(
          { id: '1' },
          mockSchema,
          expect.any(Function),
        );
        done();
      });
  });

  it('passes a StreamableFile through without validation even when a schema is set', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    const file = new StreamableFile(Buffer.from('data'));

    interceptor.intercept(makeContext(), makeNext(file)).subscribe((result) => {
      expect(validate).not.toHaveBeenCalled();
      expect(result).toBe(file);
      done();
    });
  });

  it('passes a non-object response through without validation', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

    interceptor
      .intercept(makeContext(), makeNext('plain string'))
      .subscribe((result) => {
        expect(validate).not.toHaveBeenCalled();
        expect(result).toBe('plain string');
        done();
      });
  });
});
