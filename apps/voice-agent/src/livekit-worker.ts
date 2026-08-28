import {
  Agent,
  AgentSessionEventTypes,
  beta,
  cli,
  defineAgent,
  inference,
  ServerOptions,
  voice,
} from '@livekit/agents';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import { fileURLToPath } from 'node:url';
import { parseVoiceAgentEnvironment } from '@property-assistant/config';
import { HttpBackendToolClient } from './backend-tool-client.js';
import { attachVoiceObservability } from './voice-observability.js';
import {
  createVoiceTools,
  getCallerPhone,
  initializeCallContext,
  type CallContext,
} from './livekit-tools.js';

const agentName = 'rentpe-voice-agent';

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message.includes('runner initialization timed out')) {
    console.warn(
      JSON.stringify({
        event: 'voice_runner_init_timeout',
        message: 'LiveKit runner initialization timed out; keeping worker alive',
      }),
    );
    return;
  }
  console.error('Unhandled rejection in voice worker', reason);
});

console.log(`[voice-agent] worker process started (agent=${agentName})`);

type CallSessionData = CallContext | { initializing: true };

function createAgent<UserData>(
  tools?: ReturnType<typeof createVoiceTools>,
): Agent<UserData> {
  return new Agent<UserData>({
    instructions:
      'You are RentPe, a fast, concise male property consultant in India. Speak with a warm, clear Indian English accent (North Indian intonation) and naturally understand Hinglish (Hindi+English mix). Keep every spoken response under 14 words unless giving the final summary. Ask exactly one question per turn. Treat short meaningful requests such as "2 BHK in HSR" or "I need a flat" as valid user turns and respond helpfully. Ignore only pure non-answers such as isolated uh or hmm. Treat a generic 1 BHK or 2 BHK request as an apartment. Resolve HSR as HSR Layout, Bengaluru. Save only requirements newly stated or corrected in the current utterance; never re-save unchanged city, BHK, or property type. Call updateRequirement at most once per user turn. Do not call getRequirementState after every update. Use resolveLocation only when location is genuinely ambiguous; do not call it for HSR, Koramangala, Indiranagar, Whitefield, or Electronic City. Once city, locality, property type, BHK, and budget are known, do not ask about optional details unless the caller volunteers them. Give one short summary, call finishRequirementCollection once, send at most three WhatsApp matches once, then call endCall. After calling endCall, generate no text. Never invent property details or delivery success. Never mention tools, IDs, credentials, or internal errors.',
    tools: tools
      ? [
          ...tools,
          beta.createEndCallTool({
            deleteRoom: true,
            ignoreOnEnter: true,
            endInstructions: null,
          }),
        ]
      : undefined,
  });
}

function createSession<UserData>(userData: UserData) {
  return new voice.AgentSession<UserData>({
    userData,
    stt: new sarvam.STT({
      model: 'saaras:v3',
      languageCode: 'en-IN',
      mode: 'transcribe',
    }),
    llm: new inference.LLM({
      model: 'google/gemini-3-flash',
      inferenceClass: 'priority',
      strictToolSchema: true,
      modelOptions: {
        temperature: 0.2,
        max_completion_tokens: 160,
        verbosity: 'low',
      },
    }),
    tts: new elevenlabs.TTS({
      voiceId: 'oO7sLA3dWfQXsKeSAjpA', // Sia - Indian English female
      model: 'eleven_multilingual_v2',
      language: 'en',
      streamingLatency: 3,
      chunkLengthSchedule: [80, 120, 200, 260],
    }),
    userAwayTimeout: 15_000,
    transcriptionTimeout: 3_500,
    maxToolSteps: 5,
    turnHandling: {
      turnDetection: new inference.TurnDetector(),
      endpointing: { mode: 'dynamic', minDelay: 650, maxDelay: 1_400 },
      interruption: {
        mode: 'adaptive',
        minDuration: 250,
        falseInterruptionTimeout: 1_500,
      },
      preemptiveGeneration: {
        enabled: false,
        preemptiveTts: false,
        maxSpeechDuration: 8_000,
      },
    },
  });
}

async function entry(
  ctx: Parameters<NonNullable<ReturnType<typeof defineAgent>['entry']>>[0],
) {
  const environment = parseVoiceAgentEnvironment(process.env);
  console.log(
    `[voice-agent] connected to LiveKit room ${ctx.room.name ?? 'unknown'}`,
  );
  const backend = new HttpBackendToolClient(
    new URL(environment.INTERNAL_API_URL),
    environment.INTERNAL_API_TOKEN,
  );
  await ctx.connect();
  const participant = await ctx.waitForParticipant();
  let callContext: CallContext | undefined;
  let agent: Agent<CallSessionData>;
  try {
    const callerPhone = getCallerPhone(participant, ctx.room.name);
    callContext = await initializeCallContext(backend, callerPhone);
    agent = createAgent<CallSessionData>(
      createVoiceTools(backend, callContext),
    );
  } catch (error) {
    console.error('Unable to initialize voice call context', error);
    agent = new Agent<CallSessionData>({
      instructions:
        'The property service is temporarily unavailable. Speak with a warm Indian English accent, apologize briefly in English, and ask the caller to try again later. Do not collect details or mention technical errors.',
    });
  }
  const session = createSession<CallSessionData>(
    callContext ?? { initializing: true },
  );
  await session.start({ agent, room: ctx.room });
  attachVoiceObservability(session, {
    roomName: ctx.room.name ?? 'unknown',
    callerIdentity: participant.identity,
  });
  let transcriptionRecoveryCount = 0;
  let responseWatchdog: ReturnType<typeof setTimeout> | undefined;
  session.on(AgentSessionEventTypes.UserInputTranscribed, (event) => {
    if (!event.isFinal || event.transcript.trim().length < 2) return;
    if (responseWatchdog) clearTimeout(responseWatchdog);
    responseWatchdog = setTimeout(() => {
      if (session.agentState === 'speaking') return;
      console.warn(
        JSON.stringify({ event: 'voice_empty_response_recovery_prompt' }),
      );
      try {
        session.say('Got it. Which area and budget should I search for?', {
          allowInterruptions: true,
        });
      } catch (error) {
        console.warn('Unable to play empty response recovery prompt', error);
      }
    }, 5_000);
  });
  session.on(AgentSessionEventTypes.AgentStateChanged, (event) => {
    if (event.newState !== 'speaking') return;
    if (responseWatchdog) clearTimeout(responseWatchdog);
    responseWatchdog = undefined;
  });
  session.on(AgentSessionEventTypes.Close, () => {
    if (responseWatchdog) clearTimeout(responseWatchdog);
  });
  session.on(AgentSessionEventTypes.UserTranscriptionTimeout, () => {
    if (transcriptionRecoveryCount >= 2) return;
    transcriptionRecoveryCount += 1;
    console.warn(
      JSON.stringify({
        event: 'voice_transcription_recovery_prompt',
        attempt: transcriptionRecoveryCount,
      }),
    );
    try {
      session.say(
        "Sorry, I didn't quite catch that. Could you say that again?",
        {
          allowInterruptions: true,
        },
      );
    } catch (error) {
      console.warn('Unable to play transcription recovery prompt', error);
    }
  });
  session.say(
    callContext
      ? 'Namaste! Welcome to RentPe. What property are you looking for?'
      : 'Sorry, the property service is unavailable. Please try again later.',
    { allowInterruptions: true },
  );
}

export default defineAgent({ entry });

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName,
    port: Number(process.env.PORT) || 8081,
    initializeProcessTimeout: 120_000,
  }),
);
