import { BadRequestException } from '@nestjs/common';
import { ZodError, type ZodType } from 'zod';

export function parseRequest<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException({
      message: 'Request validation failed',
      issues: result.error.issues,
    });
  }
  return result.data;
}

export function parseDatabaseError(error: unknown): never {
  const code = (error as { code?: unknown }).code;
  if (code === '23505')
    throw new BadRequestException(
      'A record with the same unique value already exists',
    );
  if (code === '23503')
    throw new BadRequestException('A referenced record does not exist');
  throw error instanceof ZodError
    ? new BadRequestException('Request validation failed')
    : error;
}
