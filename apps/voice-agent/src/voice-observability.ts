import {
  AgentSessionEventTypes,
  type AgentMetrics,
  type voice,
} from '@livekit/agents';
import { createHash } from 'node:crypto';

export function attachVoiceObservability<UserData>(
  session: voice.AgentSession<UserData>,
  context: { roomName: string; callerIdentity: string },
): void {
  const base = {
    component: 'voice-agent',
    roomHash: stableHash(context.roomName),
    callerHash: stableHash(context.callerIdentity),
  };

  session.on(AgentSessionEventTypes.MetricsCollected, ({ metrics }) => {
    console.info(
      JSON.stringify({
        ...base,
        event: 'voice_metric',
        ...metricFields(metrics),
      }),
    );
  });
  session.on(AgentSessionEventTypes.UserInputTranscribed, (event) => {
    if (!event.isFinal) return;
    console.info(
      JSON.stringify({
        ...base,
        event: 'user_transcript_final',
        language: event.language,
        characterCount: event.transcript.length,
      }),
    );
  });
  session.on(AgentSessionEventTypes.FunctionToolsExecuted, (event) => {
    console.info(
      JSON.stringify({
        ...base,
        event: 'voice_tools_executed',
        tools: event.functionCalls.map((call) => call.name),
      }),
    );
  });
  session.on(AgentSessionEventTypes.UserTranscriptionTimeout, (event) => {
    console.warn(
      JSON.stringify({
        ...base,
        event: 'user_transcription_timeout',
        speechDurationMs: event.speechDuration,
      }),
    );
  });
  session.on(AgentSessionEventTypes.Close, (event) => {
    console.info(
      JSON.stringify({
        ...base,
        event: 'voice_session_closed',
        reason: event.reason,
      }),
    );
  });
}

function stableHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function metricFields(metric: AgentMetrics): Record<string, unknown> {
  switch (metric.type) {
    case 'llm_metrics':
      return {
        metricType: metric.type,
        provider: metric.metadata?.modelProvider,
        model: metric.metadata?.modelName,
        durationMs: metric.durationMs,
        firstTokenMs: metric.ttftMs,
        outputTokens: metric.completionTokens,
        cancelled: metric.cancelled,
      };
    case 'tts_metrics':
      return {
        metricType: metric.type,
        provider: metric.metadata?.modelProvider,
        model: metric.metadata?.modelName,
        durationMs: metric.durationMs,
        firstAudioMs: metric.ttfbMs,
        audioDurationMs: metric.audioDurationMs,
        characters: metric.charactersCount,
        cancelled: metric.cancelled,
      };
    case 'stt_metrics':
      return {
        metricType: metric.type,
        provider: metric.metadata?.modelProvider,
        model: metric.metadata?.modelName,
        audioDurationMs: metric.audioDurationMs,
        streamed: metric.streamed,
      };
    case 'eou_metrics':
      return {
        metricType: metric.type,
        endOfUtteranceMs: metric.endOfUtteranceDelayMs,
        transcriptionDelayMs: metric.transcriptionDelayMs,
      };
    default:
      return { metricType: metric.type };
  }
}
