# CLAUDE.md — design-system-check

This repo is the **integration probe** for the nuri design system. Rules:

- **Import the DS only as `import { … } from '@ds'`** — never from `./ds/nuri/…` paths and
  never from `internal/`. The barrel is the contract; the internal layout is free to change.
- **`ds/nuri/` is generated** by `tools/ds-pull.mjs` — NEVER hand-edit anything under it.
  To change DS behavior, change the nuri-design-system repo and re-pull.
- **The stack mirrors nuri-expo on purpose** (Expo 53 · RN 0.79.6 · React 19.0 · TS 5.8,
  `noUnusedLocals`/`noUnusedParameters`/`noImplicitAny`). Do NOT upgrade Expo/RN/React/TS here
  independently — the probe's whole value is the version match with the consumer.
- `App.tsx` is the probe screen: it must keep exercising theme provider, View/Text/Icon layout
  props, Button variants, and the full BottomSheet family (all detents, dismissible off,
  scrim dismiss). Extend it when the DS grows surface; don't turn it into a product demo.
