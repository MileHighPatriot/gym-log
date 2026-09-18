# Gym Log

Phone-first trainer for a 6-day push / pull / legs week. Log sets at the gym, with form stills, short clips, and written cues on every lift. Data stays on the device.

## Week

- Mon / Thu — Push
- Tue / Fri — Pull
- Wed — Legs, squat-heavy
- Sat — Legs, deadlift-heavy
- Sun — Rest

## Run

```bash
npm install
npm run dev
```

On a phone: open the local URL, then **Add to Home Screen**.

```bash
npm test
npm run build
```

## Data

Logs, body weight, and program edits live in `localStorage`. Export a JSON backup from the Log tab.

Form photos are visual aids. The written cues are the source of truth.
