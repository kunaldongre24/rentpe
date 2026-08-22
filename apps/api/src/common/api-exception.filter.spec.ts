import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from './api-exception.filter.js';

describe('ApiExceptionFilter', () => {
  it('maps PostgreSQL constraint violations to a safe bad request', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    };

    new ApiExceptionFilter().catch({ code: '23514' }, host as never);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Request violates a database constraint',
    });
  });

  it('does not expose unexpected database errors', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    };

    new ApiExceptionFilter().catch(
      new Error('private database detail'),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
