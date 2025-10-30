import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log incoming request and successful response', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/test',
      body: {},
      ip: '127.0.0.1',
      headers: { host: 'localhost:3000' },
      get: jest.fn().mockReturnValue('test-agent'),
    };

    const mockResponse = {
      statusCode: 200,
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenNthCalledWith(1, {
          message: 'Incoming request',
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        });
        expect(logSpy).toHaveBeenNthCalledWith(2, {
          message: 'Request completed',
          method: 'GET',
          url: '/test',
          statusCode: 200,
          responseTime: expect.stringMatching(/\d+ms/),
        });
        done();
      },
    });
  });

  it('should log error when request fails', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/test',
      body: {},
      ip: '127.0.0.1',
      headers: { host: 'localhost:3000' },
      get: jest.fn().mockReturnValue('test-agent'),
    };

    const mockResponse = {
      statusCode: 500,
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const testError = new Error('Test error');
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => testError)),
    } as unknown as CallHandler;

    const logSpy = jest.spyOn(interceptor['logger'], 'log');
    const errorSpy = jest.spyOn(interceptor['logger'], 'error');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: () => {
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith({
          message: 'Request failed',
          method: 'POST',
          url: '/test',
          error: 'Test error',
          stack: expect.any(String),
          responseTime: expect.stringMatching(/\d+ms/),
        });
        done();
      },
    });
  });

  it('should handle missing user agent', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/test',
      body: {},
      ip: '127.0.0.1',
      headers: { host: 'localhost:3000' },
      get: jest.fn().mockReturnValue(undefined),
    };

    const mockResponse = {
      statusCode: 200,
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenNthCalledWith(1, {
          message: 'Incoming request',
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: '',
        });
        done();
      },
    });
  });
});
