import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<{ statusCode?: number }>();
        const duration = Date.now() - start;
        const method = request.method;
        const url = request.url;
        const statusCode = response?.statusCode ?? 200;

        console.info(`${method} ${url} ${statusCode} ${duration}ms`);
      }),
    );
  }
}
