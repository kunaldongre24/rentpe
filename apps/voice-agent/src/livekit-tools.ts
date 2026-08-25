import { llm } from '@livekit/agents';
import {
  locationResolveSchema,
  propertySearchQuerySchema,
  requirementBatchUpdateSchema,
  voiceToolResponseSchema,
  type VoiceToolRequest,
} from './voice-tool-contracts.js';
import { z } from 'zod';
import type { BackendToolClient } from './contracts/agent-boundaries.js';

const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/);
const callContextSchema = z.object({
  userId: z.uuid(),
  searchId: z.uuid(),
  callerPhone: e164PhoneSchema,
});

export type CallContext = z.infer<typeof callContextSchema>;

export interface CallerParticipant {
  identity: string;
  attributes: Record<string, string>;
}

const safeToolFailure = {
  success: false,
  message:
    'माफ़ कीजिए, यह जानकारी अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।',
} as const;

function normalizeIndianPhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let candidate = value
    .trim()
    .replace(/^tel:/i, '')
    .replace(/^sip:/i, '')
    .split('@', 1)[0]!
    .replace(/[<>\s().-]/g, '');
  if (candidate.startsWith('00')) candidate = `+${candidate.slice(2)}`;
  if (/^91\d{10}$/.test(candidate)) candidate = `+${candidate}`;
  if (/^\d{10}$/.test(candidate)) candidate = `+91${candidate}`;
  return e164PhoneSchema.safeParse(candidate).success ? candidate : undefined;
}

export function getCallerPhone(participant: CallerParticipant): string {
  const attributeCandidates = [
    participant.attributes['sip.phoneNumber'],
    participant.attributes['sip.callerPhoneNumber'],
    participant.attributes['sip.from'],
  ];
  for (const candidate of attributeCandidates) {
    const phone = normalizeIndianPhone(candidate);
    if (phone) return phone;
  }

  const identity = participant.identity.replace(/^sip[_:-]/i, '');
  const phone = normalizeIndianPhone(identity);
  if (!phone) throw new Error('SIP caller phone number is unavailable');
  return phone;
}

export async function initializeCallContext(
  backend: BackendToolClient,
  callerPhone: string,
): Promise<CallContext> {
  const response = voiceToolResponseSchema.parse(
    await backend.invoke({ tool: 'initializeCallContext', callerPhone }),
  );
  if (!response.ok) throw new Error('Call context initialization failed');
  return callContextSchema.parse(response.data);
}

async function invokeSafely(
  backend: BackendToolClient,
  request: VoiceToolRequest,
): Promise<unknown> {
  try {
    const response = voiceToolResponseSchema.parse(
      await backend.invoke(request),
    );
    if (!response.ok) return safeToolFailure;
    return response.data ?? { success: true };
  } catch {
    return safeToolFailure;
  }
}

export function createVoiceTools(
  backend: BackendToolClient,
  call: CallContext,
) {
  return [
    llm.tool({
      name: 'getUser',
      description:
        'Get the current caller profile. Use this when the caller name or profile is relevant. Never ask for or invent an internal user ID.',
      execute: async () =>
        invokeSafely(backend, { tool: 'getUser', userId: call.userId }),
    }),
    llm.tool({
      name: 'resolveLocation',
      description:
        'Use this only when a locality is ambiguous or unknown. Do not call it for known Bengaluru localities such as HSR, Koramangala, Indiranagar, Whitefield, or Electronic City.',
      parameters: locationResolveSchema,
      execute: async (input) =>
        invokeSafely(backend, {
          tool: 'resolveLocation',
          query: input.query,
          cityContext: input.cityContext ?? undefined,
        }),
    }),
    llm.tool({
      name: 'updateRequirement',
      description:
        'Save only requirements newly stated or corrected in the current user turn. Call at most once per turn. Do not repeat unchanged values. Use ISO YYYY-MM-DD for availability.',
      parameters: requirementBatchUpdateSchema,
      execute: async ({ requirements }) =>
        invokeSafely(backend, {
          tool: 'updateRequirement',
          searchId: call.searchId,
          requirements,
        }),
    }),
    llm.tool({
      name: 'getRequirementState',
      description:
        'Read the saved property requirement state and its missing fields. Use it after updates, then ask only for genuinely missing or unclear details.',
      execute: async () =>
        invokeSafely(backend, {
          tool: 'getRequirementState',
          searchId: call.searchId,
        }),
    }),
    llm.tool({
      name: 'searchCandidates',
      description:
        'Search only after the required requirement state is ready. Return concise results; do not read a long property list over the phone.',
      parameters: propertySearchQuerySchema,
      execute: async (query, { ctx }) =>
        ctx.filler(
          'I am checking the best available options now.',
          { delay: 350 },
          () =>
            invokeSafely(backend, {
              tool: 'searchCandidates',
              searchId: call.searchId,
              latitude: query.latitude ?? undefined,
              longitude: query.longitude ?? undefined,
              limit: query.limit,
              offset: query.offset,
              radiusMeters: query.radiusMeters,
            }),
        ),
    }),
    llm.tool({
      name: 'getMatchCount',
      description:
        'Get the number of matching properties for the saved requirements. Use this only after requirements have been saved.',
      execute: async () =>
        invokeSafely(backend, {
          tool: 'getMatchCount',
          searchId: call.searchId,
        }),
    }),
    llm.tool({
      name: 'sendMatchesToWhatsApp',
      description:
        'Send no more than three best matches, once, after the caller has heard and confirmed the summary. Do not call this repeatedly.',
      parameters: z.object({
        limit: z.coerce.number().int().min(1).max(3).default(3),
      }),
      execute: async ({ limit }, { ctx }) =>
        ctx.filler(
          'Just a moment, I am checking the listings.',
          { delay: 350 },
          () =>
            invokeSafely(backend, {
              tool: 'sendMatchesToWhatsApp',
              userId: call.userId,
              searchId: call.searchId,
              limit,
            }),
        ),
    }),
    llm.tool({
      name: 'finishRequirementCollection',
      description:
        'Use once, only after the required fields are collected, to determine whether the call can finish. Do not use after every requirement update.',
      execute: async (_, { ctx }) =>
        ctx.filler(
          'Let me confirm the details once more.',
          { delay: 500 },
          () =>
            invokeSafely(backend, {
              tool: 'finishRequirementCollection',
              searchId: call.searchId,
            }),
        ),
    }),
  ];
}
