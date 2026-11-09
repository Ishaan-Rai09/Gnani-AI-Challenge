# Hyperframes Composition Brief: CallShield

## Objective
Create a short launch-style brag video for CallShield, an AI call-screening product prototype.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21 seconds

## Source Material
- Project root: `E:\Projects\kavach`
- Primary files read: `README.md`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/landing/Hero.tsx`, `src/components/brand/Logo.tsx`, `src/lib/scenarios.ts`
- Product name: CallShield
- Tagline / strongest claim: "Your calls. Your control." / "Not every call deserves your attention."
- Key UI or visual moment to recreate: the live screening stage — transcript lines, risk-indicator chips, identity-confidence meter, HIGH risk badge, and the Block action
- Copy that must appear verbatim:
  - "Read the OTP now. Please don't hang up."
  - "I won't be sharing any codes."
  - "Not every call deserves your attention."
  - "Your calls. Your control."
  - "Unknown caller · +91 80 4712 9931"
  - "Rahul Mehta (claimed)" / "Northbridge Bank (claimed)"
  - Indicator chips: `banking_credentials`, `otp_request`, `pressure_tactics`

## Creative Direction
- Tone preset: cinematic (grounded in polished)
- Creative direction: "the gatekeeper" — the scammer is loud, the AI is calm. Editorial ivory-and-ink with signal orange as a warning light.
- Interpretation: restrained, confident pacing. Big Space Grotesk type, generous ivory space, hard cuts between dark call-stage and light statement scenes. No neon, no gradient text.
- Angle: An AI answers the scam calls you won't. A fake bank fraud officer demands an OTP; the assistant collects his signals, drops his identity confidence, refuses the code, and hands you the Block button.
- Hook: a ringing unknown number that claims to be your bank, and the demand "Read the OTP now." — inside the first 2 seconds.
- Outro / punchline: shield mark + "Not every call deserves your attention."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: `#F5F3ED` (ivory, light scenes) / `#151B26` (ink, call-stage scenes)
- Text: `#151B26` on ivory / `#F5F3ED` on ink
- Accent: `#FF6B35` (signal orange) — full saturation on focal elements, chips, badge
- Support: `#FCFBF7` (paper), `#E3DFD4` (line), `#6D7280` (muted)
- Display font: Space Grotesk (local @font-face, bold)
- Body font: Inter (local @font-face)
- Visual references from the project: shield-with-orange-check mark (ShieldMark SVG path in `src/components/brand/Logo.tsx`), app-grid background lines (56px grid, ink at 4.5%), ring-pulse animation, panel cards with `lift` shadow, uppercase micro-labels with 0.16em tracking.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook: the call — 0–4s — ink bg, app-grid, phone card with pulsing ring dot; unknown number + claimed name; scammer line "Read the OTP now. Please don't hang up." typed in.
2. Reveal — 4–7.5s — ivory; shield mark draws its orange check; "CallShield" wordmark; tagline "Your calls. Your control."
3. Highlight: live screening — 7.5–13s — ink call-stage mock; transcript alternates caller/AI (real script lines); indicator chips stamp in (`banking_credentials`, `otp_request`, `pressure_tactics`); risk meter climbs; HIGH badge snaps in orange.
4. Highlight: the decision — 13–17.5s — ivory; statement "The AI never gives up a code."; the AI's verbatim line "I won't be sharing any codes."; three actions Take Over · Allow · Block; Block presses itself (orange fill).
5. Outro — 17.5–21s — ink; shield mark + CallShield; "Not every call deserves your attention."; micro-label "AI call screening · interactive demo".

## Audio
- Audio role: cinematic support — steady, clean bed with restrained accents
- Audio arc: low and tense under the hook, tightens through the transcript, releases at the Block press, resolves warmly on the outro
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (polished/cinematic per brag tone table)
- Music treatment: volume 0.3, fade-in first 0.5s, fade to 0.12 under the final logo hit, out by 21s
- Music cue guidance: bundled preset at `<skill-dir>/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` — lock 1–3 strong cues: check completion in scene 2 (~7s), the Block press (~16.5s), and the outro logo (~18s). Sequential transcript lines may snap to nearby beats ±0.10s, but only where reading time allows.
- Audio-reactive treatment: subtle; music RMS/bass may make the scene-3 risk meter glow and the scene-1 ring pulse breathe. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 1 typing — soft interface ticks (sparingly, not per character)
  - Scene 2 check draw — dry shield hit (`interface/bong_001` or `impact/impactSoft_medium`)
  - Scene 3 chip stamps / badge — UI clicks and one low riser accent
  - Scene 4 Block press — `ui/click` + soft impact on the press
  - Scene 5 logo — `impact/impactBell_heavy_003` allowed to ring over the music
- SFX selection guidance: match interaction sounds to visible UI actions; prefer low high-frequency-risk files; fewer cues, better timed
- SFX analysis guidance: `<skill-dir>/assets/sfx/sfx-analysis.md`
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Requirements:
- Show at least one real UI element from the source project (the call-stage mock with real script copy satisfies this).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (21s target).
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet.
- Treat music cue metadata as optional timing hints.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
- Keep creation and rendering local.
