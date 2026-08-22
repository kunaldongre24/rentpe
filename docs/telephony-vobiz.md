# ProjectX Telephony: Vobiz to LiveKit

ProjectX uses Vobiz only as the telephony/SIP provider. LiveKit is the only voice-agent runtime, and NestJS remains the only business-logic backend.

```text
Indian PSTN caller
      |
      v
Vobiz Indian DID and SIP
      |
      v
LiveKit SIP inbound trunk and dispatch rule
      |
      v
ProjectX LiveKit Agent
  VAD | streaming STT | streaming LLM | streaming TTS
  interruption/barge-in | typed NestJS tool calls
      |
      v HTTPS
NestJS API
  identity | requirements | location | search | matching | WhatsApp
      |
      v
Supabase PostgreSQL

Google Cloud hosts the NestJS API and agent workers.
```

## Provider Responsibilities

Vobiz owns the Indian DID, PSTN connectivity, inbound call termination, SIP routing, and telephony-level lifecycle events where available. It does not own conversation state, AI orchestration, requirements, locations, property logic, or WhatsApp workflows.

LiveKit owns SIP media sessions, audio transport, VAD, turn detection, streaming STT/LLM/TTS orchestration, interruption, barge-in, agent lifecycle, and tool calling.

NestJS owns user identity, requirement state, location resolution, property/search logic in its approved phases, matching, persistence, and WhatsApp orchestration. The LiveKit agent never queries PostgreSQL directly.

## Environment Configuration

Use `.env.example` as the placeholder contract. Vobiz values are optional for local development and are never logged:

```text
VOBIZ_ACCOUNT_ID=
VOBIZ_DID=
VOBIZ_SIP_HOST=
VOBIZ_SIP_PORT=5060
VOBIZ_SIP_TRANSPORT=tls
VOBIZ_SIP_USERNAME=
VOBIZ_SIP_PASSWORD=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_SIP_URI=
```

The repository intentionally does not invent a Vobiz API host, SIP hostname, webhook payload, pricing, KYC rule, or concurrency entitlement. Confirm those values against the ProjectX Vobiz account and official Vobiz documentation.

## SIP Setup Shape

1. Provision an Indian Vobiz DID.
2. Confirm inbound voice and the account's KYC/verification requirements.
3. Obtain the account-specific SIP authentication and routing values.
4. Configure a LiveKit SIP inbound trunk using the Vobiz SIP route.
5. Configure a LiveKit dispatch rule that maps the DID to the ProjectX agent.
6. Configure the ProjectX agent worker with LiveKit credentials and the authenticated NestJS tool URL.
7. Make a real inbound call and verify caller audio reaches the LiveKit agent and agent audio reaches the caller.

The exact Vobiz SIP termination mode, LiveKit SIP URI, transport, authentication method, and India region selection must be confirmed per account. Prefer an India LiveKit SIP region when supported and practical to minimize media latency.

## Call Lifecycle and Isolation

Each call must have isolated state:

```text
Vobiz call ID
  -> SIP call identifiers
  -> LiveKit room/participant
  -> ProjectX callSessionId
  -> NestJS tool correlation
```

The telephony abstraction in `apps/voice-agent/src/contracts/telephony.ts` keeps provider call IDs and lifecycle statuses separate from the LiveKit runtime. `VobizTelephonyAdapter` intentionally returns no event mapping until the account-specific webhook payload is confirmed.

The initial MVP target is 5-10 concurrent inbound calls. Capacity depends on Vobiz DID/SIP limits, LiveKit capacity, agent workers, STT/LLM/TTS provider limits, NestJS capacity, and Supabase connection/query limits. Do not use global mutable conversation state.

## Runtime Flow

```text
caller speech
  -> streaming STT
  -> streaming LLM
  -> typed NestJS tool call when needed
  -> streaming TTS
  -> caller audio
```

TTS must be cancelled immediately on interruption. Tools should normally complete within about 1.5 seconds. Use a natural filler only when a tool is genuinely slow. Track STT, LLM, TTS, tool, interruption, and total-turn latency separately.

## Onboarding Checklist

- [ ] Create Vobiz account.
- [ ] Complete account verification/KYC required by Vobiz.
- [ ] Confirm Indian DID availability.
- [ ] Provision the Indian DID.
- [ ] Confirm inbound calling is enabled.
- [ ] Confirm the account supports the 5-10 call MVP target.
- [ ] Obtain SIP credentials or configure SIP authentication.
- [ ] Configure Vobiz SIP routing.
- [ ] Configure the LiveKit SIP inbound trunk.
- [ ] Configure the LiveKit dispatch rule.
- [ ] Map the DID to the ProjectX agent.
- [ ] Make a real inbound test call.
- [ ] Verify caller audio reaches LiveKit.
- [ ] Verify agent audio reaches the caller.
- [ ] Verify interruption/barge-in.
- [ ] Verify disconnect and failure handling.
- [ ] Verify concurrent calls remain isolated.
- [ ] Record latency metrics.

Do not call the voice MVP production-ready until a real inbound call completes successfully.
