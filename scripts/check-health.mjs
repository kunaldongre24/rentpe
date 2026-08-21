const targets = [
  ['api', process.env.API_HEALTH_URL ?? 'http://localhost:3001/api/health'],
  [
    'voice-agent',
    process.env.VOICE_HEALTH_URL ?? 'http://localhost:3002/health',
  ],
];

for (const [name, url] of targets) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${name} health check failed with ${response.status}`);
  console.log(`${name}: healthy`);
}
