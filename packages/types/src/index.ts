export interface HealthResponse {
  service: string;
  status: 'ok';
  timestamp: string;
  version: string;
}

export type RuntimeEnvironment = 'development' | 'test' | 'production';
