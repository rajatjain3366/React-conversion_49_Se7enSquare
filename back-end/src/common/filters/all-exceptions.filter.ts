import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: FileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    // Extra fields some errors carry (see auth-context.guard.ts):
    // { code: 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED', reason, until }.
    const accountStatusFields: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
        // Keep code/reason/until in the response. Before, only `message` was
        // copied, so the frontend never saw code === 'ACCOUNT_BANNED' and its
        // "log out and go to /login" redirect for sanctioned users never ran.
        for (const key of ['code', 'reason', 'until']) {
          if ((res as any)[key] !== undefined) accountStatusFields[key] = (res as any)[key];
        }
      } else if (typeof res === 'string') {
        message = res;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Sanitize filesystem paths from error messages (e.g. ENOENT from ServeStatic)
      // to prevent leaking internal directory structure in error responses
      message = exception.message.replace(/\/[^\s,]+/g, '[path]');
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Always return a safe generic message for unexpected 500 errors (no internal details to clients)
    const clientMessage =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : message;

    const errorResponse: Record<string, any> = {
      success: false,
      statusCode: status,
      message: clientMessage,
      ...accountStatusFields,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Include sanitized stack trace in development (NOT production, NOT for 500s which might leak paths)
    if (!isProduction && status !== HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error && exception.stack) {
      // Sanitize absolute paths from stack trace before including in client response
      errorResponse.stack = exception.stack.replace(/\/[^\s:)]+/g, (match) =>
        match.includes('node_modules') ? match : '[path]',
      );
    }

    // Log the error to error.log
    const stackTrace = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `HTTP ${status} on ${request.method} ${request.url} - ${JSON.stringify(clientMessage)}`,
      stackTrace,
      'AllExceptionsFilter',
    );

    response.status(status).json(errorResponse);
  }
}
