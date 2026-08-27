#!/usr/bin/env node
import { createServer } from 'node:http';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 8080;

const healthServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'voice-agent' }));
});

healthServer.listen(port, '0.0.0.0', () => {
  console.log(`Health server listening on port ${port}`);

  const workerPath = join(__dirname, 'livekit-worker.js');
  const workerEnv = { ...process.env, PORT: '8081' };
  const child = fork(workerPath, ['start'], {
    stdio: 'inherit',
    env: workerEnv,
    execArgv: process.execArgv,
  });

  child.on('exit', (code) => {
    console.error(`LiveKit worker exited with code ${code}`);
    process.exit(code ?? 1);
  });

  child.on('error', (err) => {
    console.error('Failed to fork LiveKit worker', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
});
