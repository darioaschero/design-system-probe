# design-system-check

The **nuri DS integration probe**: a minimal Expo app that deliberately mirrors
**nuri-expo's exact stack** — Expo 53 · RN 0.79.6 · React 19.0 · TS 5.8 (same strict flags) —
and consumes a **vendored** copy of `@nuri/rn` from a nuri-design-system git tag. If a DS tag
passes here, it integrates in nuri-expo.

This is not a demo app. It exists to answer one question per release: *does this tag compile,
bundle, and render on the consumer's stack?*

## Pull a DS version

```bash
npm run ds:pull rn/v0.1.0-alpha.1        # pin to a tag
npm run ds:pull -- --local ../nuri       # dev loop against a local DS checkout
```

The script clones the DS repo at the tag, runs **that tag's own exporter**
(`scripts/export-rn.mjs` — it rewrites the `@nuri/spec/*` imports to relative paths), replaces
`ds/nuri/` wholesale, stamps `ds/nuri/MANIFEST.json` with the pin, and gates on this app's
`tsc --noEmit`. `ds/nuri/` is generated — never edit it by hand; upgrading is a re-pull and the
whole upgrade is one reviewable diff.

## Gates

```bash
npm run typecheck                        # TS 5.8 + nuri-expo strict flags
npx expo export --platform web --platform ios   # Metro resolution + Hermes bundle
npm run web                              # render check: screen + sheet (all detents, scrim dismiss)
npm run ios                              # native leg: animation feel, keyboard, safe area
```

## History

The previous incarnation of this repo was a first-pass consumer spike (`nuri-vault-spike`,
Expo 56) — its API-gap findings are preserved in [SPEC-FEEDBACK.md](SPEC-FEEDBACK.md) and feed
the DS component roadmap (TextInput, Button children typing, icon coverage, …). The sheet gap
it recorded (F-MODAL-1) is closed by the BottomSheet family this probe now exercises.
