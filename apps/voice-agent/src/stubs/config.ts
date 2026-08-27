export function parseVoiceAgentEnvironment(environment: NodeJS.ProcessEnv) {
  return {
    NODE_ENV: (environment.NODE_ENV as 'development' | 'test' | 'production') ?? 'production',
    VOICE_AGENT_PORT: Number(environment.VOICE_AGENT_PORT ?? 3002),
    INTERNAL_API_URL: environment.INTERNAL_API_URL ?? 'http://localhost:3001',
    INTERNAL_API_TOKEN: environment.INTERNAL_API_TOKEN ?? 'stub-token-32-chars-minimum-length',
    SARVAM_API_KEY: environment.SARVAM_API_KEY ?? '',
    ELEVEN_API_KEY: environment.ELEVEN_API_KEY ?? '',
  };
}
