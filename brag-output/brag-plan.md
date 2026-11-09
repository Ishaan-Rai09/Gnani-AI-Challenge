# CallShield — Brag Plan

## The 9 answers

1. **What is the app?** CallShield is an AI call-screening product prototype: an assistant answers unknown callers, interrogates their identity and intent, transcribes live, surfaces scam signals, and hands the decision — allow, end, block — back to you.
2. **Most impressive claim?** "Not every call deserves your attention." And the kill line from the demo script: a scammer demands the OTP, and the assistant answers *"I won't be sharing any codes."*
3. **Visual hook?** The palette: warm ivory paper against ink, with a single signal-orange accent (#FF6B35) that behaves like a warning light. Plus the shield-with-orange-check mark and the ring-pulse incoming-call animation.
4. **What to show from the actual UI?** The live screening stage: transcript lines appearing, risk indicators popping in (`otp_request`, `pressure_tactics`), identity confidence dropping 52 → 30, the HIGH risk badge, and the Block action.
5. **Shortest satisfying video?** ~20 seconds: hook (scam call demands OTP) → reveal (AI answered it for you) → two sharp highlights → punchline block → outro.
6. **Tone?** Preset: `cinematic` energy grounded in `polished` typography. Creative direction: "the gatekeeper" — quiet, editorial confidence; the scammer is loud, the AI is calm.
7. **Audio feel?** Low, tense electronic bed that tightens during the scammer lines and releases on the block; restrained UI-tick SFX on transcript reveals; one dry shield hit on the logo.
8. **Share caption?** "An AI answered a bank scam call so I didn't have to. It asked for the OTP. The assistant said no." 
9. **User flow worth showing?** Ringing → Let AI Answer → live transcript with risk indicators climbing → Block → call saved to history/blocklist. (Entry → key action → result.)

## Colors (exact)

- Background: `#F5F3ED` (ivory) — dark scenes use `#151B26` (ink)
- Primary text: `#151B26` (ink) — inverse `#F5F3ED`
- Accent/brand: `#FF6B35` (signal)
- Support: `#FCFBF7` (paper), `#E3DFD4` (line), `#6D7280` (muted)

## Fonts

- Display: Space Grotesk (bold, tight -0.04em tracking)
- Body: Inter

## Storyboard — 21s, landscape

| # | Scene | Time | Content | Motion / transition | SFX cue |
|---|-------|------|---------|--------------------|---------|
| 1 | Hook: the call | 0–4s | Ink background. Subtle app-grid lines. A phone-card: pulsing ring dot, "Unknown caller · +91 80 4712 9931", callerName "Rahul Mehta (claimed)". Caller line types in: "Read the OTP now. Please don't hang up." | Ring pulse ripples; card rises in; text typewriter; slight punch-in on "OTP" with orange highlight | Low tense pulse; phone-ring tick ×2 |
| 2 | Reveal | 4–7.5s | Hard cut to ivory. Shield mark draws its orange check; wordmark "CallShield" in Space Grotesk. Tagline: "Your calls. Your control." Sub: "An AI answers the calls you won't." | Check strokes on; wordmark rises; camera settles | Bed tightens; dry shield hit on check completion |
| 3 | Highlight: live screening | 7.5–13s | Dark call-stage mock: transcript lines from the real script alternate caller/AI; as the caller asks for card+OTP, indicator chips pop in — `banking_credentials`, `otp_request`, `pressure_tactics`; a risk meter climbs and the badge snaps to HIGH (orange). | Lines rise in on beat; chips stamp in with tiny scale-bounce; badge slams with 2px shake | UI ticks per line; low riser under meter |
| 4 | Highlight: the decision | 13–17.5s | Ivory. Big statement type: "The AI never gives up a code." Then the AI's line verbatim: "I won't be sharing any codes." Below, three actions appear — Take Over · Allow · **Block** — with Block pressing itself (scale-down press, orange fill). | Text holds long enough to read; Block button press at ~16.5s | Beat drop on press; soft click |
| 5 | Outro | 17.5–21s | Ink. Shield mark + CallShield wordmark centered; hero line: "Not every call deserves your attention." Micro-line: "AI call screening · interactive demo". | Fade-up, gentle settle; orange underline wipes under "attention" | Bed resolves; final low hit |

**Total: 21s.** Hook at 0s, product UI visible in scenes 1, 3, 4.

## Music cue guidance

Tense, minimal electronic bed, ~95–105 BPM feel. Cues detected at composition time (no bundled cue preset chosen); beats should align to: scene-2 check completion (~7s), transcript line reveals in scene 3, the Block press (~16.5s), and the final logo hit (~18s). Story, readability and product clarity stay primary — cue alignment is guidance only.

## Creative laws check

- Short: 21s ✓
- Readable: longest line is the AI's quote (~0.3s/word, held ~2.5s) ✓
- Specific: real numbers (+91 80 4712 9931), real script lines, real indicator names ✓
- Shows the thing: scenes 1, 3, 4 recreate the actual screening UI ✓
- No generic SaaS language: copy pulled from the product ✓
- Hook: a scammer demanding the OTP, in the first 2 seconds ✓
- Humor: dry — the calm "claimed" tag next to the scammer's name ✓
