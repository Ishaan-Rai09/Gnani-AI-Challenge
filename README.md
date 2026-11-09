# CallShield

**Your calls. Your control.**

CallShield is a polished, interactive prototype of an AI call-screening product. An assistant answers simulated unknown callers, collects their identity and intent, transcribes the conversation progressively, and surfaces suspicious signals — then hands the decision back to the user.

> **Prototype notice:** CallShield does not intercept real cellular calls or access a phone's call log. With an optional Gnani key, simulated callers are voiced and your spoken replies are transcribed; without one, the demo runs in captions-only mode. Every caller, number, and organisation is fictional, and risk labels are heuristic signals, not proof of fraud.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No API keys or database config are required — the demo runs without voice and without sign-in.

### Optional: sign in with Google (per-user data)

Call history and the blocklist can live on a real account instead of the browser. Add a MongoDB connection string plus Google OAuth credentials and restart:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/callshieldAI?retryWrites=true&w=majority"
AUTH_SECRET=<long random string>
GOOGLE_CLIENT_ID=<from https://console.cloud.google.com/apis/credentials>
GOOGLE_CLIENT_SECRET=<secret>
```

- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
- Allow your IP (or `0.0.0.0/0` for development) in the Atlas network access list.
- Collections `users`, `calls`, and `blocked` are created automatically on first sign-in; users get a unique index on `email`.
- Signed-in users see their real Google name, email, and photo in Settings, and each account gets its own server-persisted call history and blocklist (`/api/user/*` routes, scoped by user id). Assistant settings and notifications stay on the device.
- Without `MONGODB_URI` or the Google credentials, the app runs in demo mode exactly as before: everything is stored in `localStorage` for that browser only.

### Optional: real call voices with Gnani

Copy `.env.example` to `.env.local`, add `GNANI_API_KEY`, and restart the dev server:

```bash
GNANI_API_KEY=your_key_here
```

With a key present:

- every caller and assistant line is synthesised through Gnani Timbre and played inside the call stage;
- **Take Over → Speak** records up to 25 seconds, converts it to 16 kHz mono WAV in the browser, and transcribes it with Gnani Prisma;
- the script waits for each spoken line to finish before revealing the next, so captions and audio stay in step;
- the key is used only inside `/api/voice/tts` and `/api/voice/stt` route handlers — it is never exposed to the client.

Run `npm run test:voice` while the app is running to synthesise a line and feed it back through speech-to-text. Audio needs a real user gesture (`Let AI Answer` or the microphone button) because browsers block autoplay. Without a key, or if Gnani errors, the call automatically falls back to paced captions and typed replies.

Production build:

```bash
npm run build
npm start
```

## Demo flow

1. Open the landing page and select **Try Live Demo**.
2. On the dashboard, select **Simulate Incoming Call**.
3. Choose **Bank impersonation scam** (selected by default) and start the call.
4. Select **Let AI Answer**.
5. Watch the transcript appear line by line while risk indicators update.
6. Take over the call, allow the caller, end the screening, or block the caller.
7. Open the blocklist and call history to verify the decision was saved.

All state is persisted in `localStorage`, so history, blocklist entries, settings, notifications, and profile changes survive a refresh.

## What is included

### Marketing site
- Hero with an interactive, auto-playing screening preview across three scam types.
- How-it-works, feature grid, control/trust section, CTA, and footer.
- Plain-language legal notes at `/legal`.

### Dashboard
- Overview with calls screened, suspicious callers, safely handled calls, and calls needing attention.
- Prominent live-screening panel with quick scenarios.
- Recent activity table with risk and final action.
- Assistant status, signal mix, and blocklist snapshot.
- Animated sidebar, mobile tab bar, drawer navigation, notifications, and toasts.

### Live screening
- Six scripted scenarios: appointment confirmation, bank impersonation, fake KYC, delivery payment, prize scam, and investment offer.
- Incoming-call screen with **Let AI Answer** / **Decline**.
- Voice-first call stage with live captions, animated waveform, mute control, and a collapsible full transcript.
- Caller and assistant audio through Gnani Timbre; six assistant voices with preview in settings.
- Push-to-talk replies transcribed by Gnani Prisma, plus a typed fallback and quick replies.
- Live changer of intent, risk level, suspicious indicators, information requested, identity confidence, and AI summary.
- **Take Over**, **Allow**, **End**, and **Block** actions.
- Final summary with a link to the saved call report.

### Call history
- Search across numbers, names, organisations, intent, and summaries.
- Risk filters, newest/oldest sort, empty state with **Try Demo Data**.
- Full call detail: complete transcript, signals, summary, identity confidence, final action, and event timeline.
- Block a number directly from the record.

### Blocklist
- Manual add, search, remove with confirmation.
- Automatic entries when a caller is blocked from live screening.
- Source, reason, and timestamp for every entry.

### AI Assistant
- Enable/disable screening, screening mode, greeting editor with live preview, language preference.
- Call voice toggle, assistant voice picker with preview, and live Gnani connection status.
- Caller-information questions and suspicious-call handling preference (no automatic blocking).
- Notification preferences.

### Settings
- Editable demo profile.
- Restore demo data, clear call history, export a JSON snapshot.
- Installable PWA controls and local-storage overview.

### PWA
- Web app manifest, 192/512/maskable icons, Apple touch icon.
- Scoped service worker: cache-first static assets, network-first navigation, offline fallback.
- `/offline.html` branded offline page.
- Responsive layouts from mobile through desktop.

## Architecture

```
src/
  app/                    Next.js App Router routes and API
    app/                  Authenticated-style app shell and pages
    api/integrations/     Server-side integration status (no secrets exposed)
    api/voice/            Authenticated Gnani TTS + STT proxies
  components/
    app/                  Shell, navigation, overview modules
    assistant/            Assistant settings UI
    blocklist/            Blocklist UI
    history/              History and call detail UI
    landing/              Marketing sections
    live/                 Incoming call, screening room, summary
    settings/             Account and demo-data settings
    ui/                   Buttons, modals, badges, toasts, toggles
  lib/
    scenarios.ts          Six scripted call scenarios
    risk.ts               Indicator catalog and scoring
    seed.ts               Seeded calls, blocklist, notifications, defaults
    store.tsx             Persisted state, live-session engine, actions
    services/             Conversation, risk, and simulation logic
    server/gnani.ts       Server-only Timbre + Prisma client
    voice/                Voice catalog, playback provider, speech-paced driver, mic recorder
    types.ts              Shared domain types
```

### Simulation engine

`callSimulationService` is a pure orchestration layer. A session moves through `ringing → screening → user/ended`. A one-second clock reveals due script lines, collects indicators and requested information, and recomputes risk through `riskAnalysisService`.

When voice is active, `CallVoiceDriver` speaks each new line and sets a speech hold. The clock keeps elapsed time honest but reveals no new lines until the audio finishes, so the conversation is paced by the voices rather than a fixed timer. Dialects, accents, and pace are limited by the provider's voices; the demo scripts remain authored text.

The six scenarios live entirely in `src/lib/scenarios.ts`, so adding a seventh scenario only requires adding an entry to that array. Each step can carry:

```ts
{
  at: 12,                        // seconds into the call
  speaker: "caller",
  text: "Read me the OTP…",
  reveals: ["otp_request"],      // indicators surfaced at this line
  infoRequested: ["OTP"],         // what the caller is asking for
  identityConfidence: 34
}
```

### Voice pipeline

```
caller / assistant line ──► POST /api/voice/tts ──► Gnani Timbre ──► mp3 ──► <audio>
your reply ──► MediaRecorder ──► 16 kHz WAV ──► POST /api/voice/stt ──► Gnani Prisma ──► text
```

- `src/lib/server/gnani.ts` is the only place that reads `GNANI_API_KEY`. It configures `timbre-v2.5` and `prisma-v2.5`, maps upstream errors to readable messages, and caches synthesised lines in-process.
- The two route handlers validate input, cap TTS text at 600 characters and uploads at 8 MB, and never echo the key. `/api/integrations/status` returns only booleans, model names, and modes.
- `VoiceProvider` caches audio blobs in memory for the page lifetime, stops playback on takeover, and exposes autoplay/credential failures as an inline notice instead of breaking the call.
- Browser recordings are WebM/Opus, which Gnani does not accept, so `wav.ts` decodes them with `AudioContext` and re-encodes 16-bit mono PCM at 16 kHz.
- Gnani STT accepts clips up to 30 seconds; the UI caps recording at 25 seconds.
- Voice is optional. With no key, `CallVoiceDriver` releases the speech hold immediately and the call runs as captions plus typed replies.

## Verification

- `npx tsc --noEmit` — passes.
- `npm run build` — production build passes.
- `node scripts/mongo-check.mjs` — pings the configured MongoDB Atlas cluster, creates the `users.email` unique index, and round-trips a test document.
- `npm run test:demo` — drives the app in Chrome via `playwright-core`: landing → dashboard → bank scam → voice-call stage → progressive risk → block → blocklist → history detail → notifications → takeover/typed fallback → voice settings → allow → history filters → blocklist removal/manual add → empty history restore → PWA/service worker checks. Requires the app running and Chrome installed; set `CHROME_PATH` if Chrome is in a non-default location.
- `npm run test:voice` — requires `GNANI_API_KEY` and a running app. Synthesises a line through the TTS route, posts the audio back to the STT route, and checks word overlap. This is the only check that spends Gnani credits.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide · NextAuth v5 (Google) · MongoDB (Atlas) · Gnani voice (optional) · Service worker · playwright-core for local verification.

## Known limitations

- Calls are scripted simulations, not a live telephony integration.
- Data is local to one browser and is not encrypted at rest beyond browser storage.
- Notifications are in-app only; no push, email, or SMS provider is connected.
- The demo scripts are in English even though the assistant language preference is stored.
- This is not a substitute for verified caller authentication or a real fraud determination.
