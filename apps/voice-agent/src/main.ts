import { createServer } from 'node:http';
import { parseVoiceAgentEnvironment } from '@property-assistant/config';
import { getVoiceAgentHealth } from './app.js';

const environment = parseVoiceAgentEnvironment(process.env);
const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(getVoiceAgentHealth()));
    return;
  }
  response.writeHead(404).end();
});

server.listen(environment.VOICE_AGENT_PORT, '0.0.0.0', () => {
  console.log(
    `Voice-agent foundation listening on ${environment.VOICE_AGENT_PORT}`,
  );
});
