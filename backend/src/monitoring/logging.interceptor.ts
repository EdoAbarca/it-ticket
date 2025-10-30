import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Sanitize URL to remove query parameters that might contain sensitive data
    const url = new URL(
      request.url,
      `http://${request.headers.host || 'localhost'}`,
    );
    const sanitizedUrl = url.pathname;

    // Log incoming request
    this.logger.log({
      message: 'Incoming request',
      method,
      url: sanitizedUrl,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.log({
            message: 'Request completed',
            method,
            url: sanitizedUrl,
            statusCode,
            responseTime: `${responseTime}ms`,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          this.logger.error({
            message: 'Request failed',
            method,
            url: sanitizedUrl,
            error: error.message,
            stack: error.stack,
            responseTime: `${responseTime}ms`,
          });
        },
      }),
    );
  }
}
