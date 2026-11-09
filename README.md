# CallShield

**Your calls. Your control.**

> 🏆 **Built for the Gnani Hackathon** — CallShield is a voice-first showcase of what Gnani's speech stack can do end to end: [Gnani Timbre](https://docs.vachana.ai) (`timbre-v2.5`) voices every caller and the AI assistant, and [Gnani Prisma](https://docs.vachana.ai) (`prisma-v2.5`) transcribes your spoken replies in real time. Every conversation you hear in this app is spoken by Gnani, and every word you say back is understood by Gnani.

CallShield is a polished, interactive prototype of an AI call-screening product. An assistant answers simulated unknown callers, collects their identity and intent, transcribes the conversation progressively, and surfaces suspicious signals — then hands the decision back to the user. Think of it as a spam shield for phone calls: the AI picks up first, so you never have to.

## Why Gnani is the heart of it

| Gnani service | Where it is used | What it does |
|---|---|---|
| **Timbre TTS** (`timbre-v2.5`) | Every caller line + every assistant line | Six distinct assistant voices with live preview; speech-paced calls where captions wait for audio |
| **Prisma STT** (`prisma-v2.5`) | Take Over → Speak (hands-free mic) | Your spoken replies are recorded, re-encoded to 16 kHz WAV in the browser, and transcribed server-side |
| **Live status** | `/api/integrations/status` | Real connection state surfaced in the UI — judges can see Gnani is wired in |

The result is a real two-way voice conversation: the scammer argues back through Timbre while you push back with your own voice through Prisma — all without a single line of telephony infrastructure.

> **Prototype notice:** CallShield does not intercept real cellular calls or access a phone's call log. Every caller, number, and organisation is fictional, and risk labels are heuristic signals, not proof of fraud. Without a Gnani key, the demo gracefully degrades to captions-only mode.

## 60-second demo script (for judges)

1. **Sign in with Google** — your profile picture appears; history/blocklist are saved to your account in MongoDB.
2. **Simulate Incoming Call → Bank impersonation scam → Let AI Answer.** Listen: the scammer speaks through Gnani Timbre while risk indicators climb live.
3. **Take Over** — the mic goes hands-free. Just talk: your reply is transcribed by Gnani Prisma, and the caller argues back through Timbre.
4. **Block the caller** — the blocklist entry appears instantly, saved to your MongoDB account.
5. Open **Call History** → the full transcript, signals, summary, and timeline are saved with the recording of what Gnani heard from you.
6. Install it as a **PWA** from the browser menu and run it like a native app.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No API keys or database config are required — the demo runs without voice and without sign-in.

### Optional: real call voices with Gnani

Add `GNANI_API_KEY` to `.env.local` and restart the dev server:

```bash
GNANI_API_KEY=your_key_here
```

With a key present:

- every caller and assistant line is synthesised through Gnani Timbre and played inside the call stage;
- **Take Over → Speak** records up to 25 seconds, converts it to 16 kHz mono WAV in the browser, and transcribes it with Gnani Prisma;
- hands-free mode keeps the mic armed after take-over — speak naturally, and the caller responds through Timbre;
- the script waits for each spoken line to finish before revealing the next, so captions and audio stay in step;
- the key is used only inside `/api/voice/tts` and `/api/voice/stt` route handlers — it is never exposed to the client.

Run `npm run test:voice` while the app is running to synthesise a line and feed it back through speech-to-text. Audio needs a real user gesture (`Let AI Answer` or the microphone button) because browsers block autoplay. Without a key, or if Gnani errors, the call automatically falls back to paced captions and typed replies.

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
- Signed-in users see their real Google name, email, and photo in Settings, and each account gets its own server-persisted call history and blocklist (`/api/user/*` routes, scoped by user id). Assistant settings and the phone label stay on the device.
- Without `MONGODB_URI` or the Google credentials, the app runs in demo mode exactly as before: everything is stored in `localStorage` for that browser only.

Production build:

```bash
npm run build
npm start
```

## Demo flow

1. Open the landing page and select **Sign in** → **Continue with Google** (or continue in demo mode).
2. On the dashboard, select **Simulate Incoming Call**.
3. Choose **Bank impersonation scam** (selected by default) and start the call.
4. Select **Let AI Answer** and listen to the Gnani-voiced screening.
5. Watch the transcript appear line by line while risk indicators update.
6. **Take Over** — speak hands-free; the caller argues back through Gnani Timbre.
7. Allow, end, or block the caller, and open the blocklist and call history to verify the decision was saved to your account.

Guests persist everything in `localStorage`; signed-in users persist calls and blocked numbers in MongoDB, and assistant preferences on the device.

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
- Hands-free mic replies transcribed by Gnani Prisma (with push-to-talk toggle), plus a typed fallback and quick replies.
- After take-over the caller responds to what you say — scripted rebuttals plus generic pushback once the script runs out.
- Live changer of intent, risk level, suspicious indicators, information requested, identity confidence, and AI summary.
- **Take Over**, **Allow**, **End**, and **Block** actions.
- Final summary with a link to the saved call report.

### Call history
- Search across numbers, names, organisations, intent, and summaries.
- Risk filters, newest/oldest sort, empty state with **Load sample calls**.
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
- Real Google profile (name, email, photo) for signed-in users; editable phone label stored on the device.
- Restore sample data, clear call history, export a JSON snapshot.
- Installable PWA controls and storage overview.

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
    api/auth/[...nextauth]/ NextAuth v5 route handlers (Google)
    api/user/             Per-user calls, blocklist, and state (MongoDB, scoped by user id)
    api/integrations/     Server-side integration status (no secrets exposed)
    api/voice/            Gnani TTS + STT proxies (key stays server-side)
  components/
    app/                  Shell, navigation, overview modules
    assistant/            Assistant settings UI
    blocklist/            Blocklist UI
    history/              History and call detail UI
    landing/              Marketing sections
    live/                 Incoming call, screening room, summary
    settings/             Account settings (Google profile + data controls)
    ui/                   Buttons, modals, badges, toasts, toggles
  lib/
    scenarios.ts          Six scripted call scenarios
    risk.ts               Indicator catalog and scoring
    seed.ts               Seeded calls, blocklist, notifications, defaults
    store.tsx             Auth-aware state, live-session engine, server sync
    services/             Conversation, risk, and simulation logic
    server/gnani.ts       Server-only Timbre + Prisma client
    server/auth.ts        NextAuth v5 config (Google provider, JWT sessions)
    server/db.ts          MongoDB client, typed collections, unique indexes
    voice/                Voice catalog, playback provider, speech-paced driver, mic recorder
    types.ts              Shared domain types
```

### Simulation engine

`callSimulationService` is a pure orchestration layer. A session moves through `ringing → screening → user/ended`. A one-second clock reveals due script lines, collects indicators and requested information, and recomputes risk through `riskAnalysisService`.

When voice is active, `CallVoiceDriver` speaks each new line and sets a speech hold. The clock keeps elapsed time honest but reveals no new lines until the audio finishes, so the conversation is paced by the voices rather than a fixed timer. Dialects, accents, and pace are limited by the provider's voices; the demo scripts remain authored text.

After the account holder takes over, the caller stays in the conversation: each spoken or typed reply makes the caller take the next scripted line (or a generic pushback once the script runs out), and risk is recomputed on every exchange.

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

### Data & auth

- **Auth:** NextAuth v5 with Google — JWT sessions, credentials passed explicitly to the provider, per-user rows namespaced `${userId}:${recordId}` so every query is naturally scoped to one account.
- **Storage:** MongoDB Atlas (`users`, `calls`, `blocked`). The `users.email` unique index backs the sign-in upsert; collections are created on first use.
- **Graceful degradation everywhere:** no Gnani key → captions-only; no MongoDB/Google → local-storage demo. The prototype never hard-fails because a credential is missing.

## Verification

- `npx tsc --noEmit` — passes.
- `npm run build` — production build passes.
- `node scripts/mongo-check.mjs` — pings the configured MongoDB Atlas cluster, creates the `users.email` unique index, and round-trips a test document.
- `node scripts/verify-user-routes.mjs` — signs a real session and drives every per-user API route (reset, seed, clear, blocklist add/remove, save call) against the live database.
- `npm run test:demo` — drives the app in Chrome via `playwright-core`: landing → dashboard → bank scam → voice-call stage → progressive risk → block → blocklist → history detail → notifications → takeover/typed fallback → voice settings → allow → history filters → blocklist removal/manual add → empty history restore → PWA/service worker checks. Requires the app running and Chrome installed; set `CHROME_PATH` if Chrome is in a non-default location.
- `npm run test:voice` — requires `GNANI_API_KEY` and a running app. Synthesises a line through the TTS route, posts the audio back to the STT route, and checks word overlap. This is the only check that spends Gnani credits.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide · **Gnani Timbre TTS + Prisma STT** · NextAuth v5 (Google) · MongoDB (Atlas) · Service worker · playwright-core for local verification.

## Known limitations

- Calls are scripted simulations, not a live telephony integration.
- Signed-in data is stored in MongoDB in plaintext JSON blobs (no field-level encryption); guest data lives in browser storage.
- Notifications are in-app only; no push, email, or SMS provider is connected.
- The demo scripts are in English even though the assistant language preference is stored.
- Hands-free mic relies on browser echo cancellation; loud speakers may leak caller audio into a clip.
- This is not a substitute for verified caller authentication or a real fraud determination.
