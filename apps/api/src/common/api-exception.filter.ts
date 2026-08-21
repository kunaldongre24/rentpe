import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json(error.getResponse());
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
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
