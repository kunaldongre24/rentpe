import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    const exception = error as {
      getResponse?: () => unknown;
      getStatus?: () => number;
    };
    if (exception.getStatus && exception.getResponse) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    const code = (error as { code?: unknown }).code;
    if (code === '23505') {
      response.status(409).json({
        statusCode: 409,
        message: 'A record with the same unique value already exists',
      });
      return;
    }
    if (code === '23503') {
      response.status(400).json({
        statusCode: 400,
        message: 'A referenced record does not exist',
      });
      return;
    }
    if (
      code === '23514' ||
      code === '22P02' ||
      code === '22001' ||
      code === '22003' ||
      code === '22007' ||
      code === '22008'
    ) {
      response.status(400).json({
        statusCode: 400,
        message: 'Request violates a database constraint',
      });
      return;
    }
    this.logger.error(
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Unknown non-Error exception',
    );
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
