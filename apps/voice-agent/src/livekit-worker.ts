import {
  Agent,
  cli,
  defineAgent,
  inference,
  ServerOptions,
  voice,
} from '@livekit/agents';
import { fileURLToPath } from 'node:url';

const agentName = 'projectx-voice-agent';

function createAgent() {
  return new Agent({
    instructions:
      'You are the ProjectX property receptionist. Speak briefly and naturally. Ask only necessary questions. Use NestJS tools for identity, requirements, location resolution, and search. Never reveal tools, identifiers, or internal errors.',
  });
}

async function entry(
  ctx: Parameters<NonNullable<ReturnType<typeof defineAgent>['entry']>>[0],
) {
  const session = new voice.AgentSession({
    stt: new inference.STT({
      model: 'assemblyai/universal-3-5-pro',
      language: 'en',
    }),
    llm: new inference.LLM({ model: 'google/gemma-4-31b-it' }),
    tts: new inference.TTS({
      model: 'rime/mistv2',
      voice: 'Taru',
      language: 'hi',
    }),
    turnHandling: {
      turnDetection: new inference.TurnDetector(),
      interruption: { mode: 'adaptive' },
      preemptiveGeneration: { enabled: true },
    },
  });
  await session.start({ agent: createAgent(), room: ctx.room });
  await ctx.connect();
  session.generateReply({
    instructions:
      'Greet the caller and ask how you can help with their property search.',
  });
}

export default defineAgent({ entry });

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName,
  }),
);
