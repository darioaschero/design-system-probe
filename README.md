# design-system-probe

Working example of **how nuri-expo adopts the nuri design system**. This app deliberately
mirrors nuri-expo's stack — Expo 53 · RN 0.79.6 · React 19.0 · TS 5.8, same strict flags — so
everything you see here transfers 1:1. If it works here, it works in nuri-expo.

## Adopting the DS in nuri-expo — 4 steps

**1 · Copy the pull script** (one file, no dependencies):

```bash
cp tools/ds-pull.mjs  <nuri-expo>/tools/ds-pull.mjs
```

**2 · Run it** (pin to a release tag — needs read access to nuri-design-system):

```bash
node tools/ds-pull.mjs rn/v0.1.0-alpha.5
```

This vendors the DS into `ds/nuri/` (self-contained TS source, zero new npm dependencies —
only react/react-native/react-native-svg, which nuri-expo already has) and gates on your own
`tsc --noEmit`. The folder is **generated**: never edit it, commit it as-is. Upgrading is
re-running with a new tag — the whole upgrade is one reviewable PR diff. See
[`ds/nuri/README.md`](ds/nuri/README.md) for the vendored version, the component inventory,
and per-component doc links.

**3 · Add the `@ds` alias** to `tsconfig.json` (Metro resolves it natively on Expo 50+):

```jsonc
"compilerOptions": {
  "paths": { "@ds": ["./ds/nuri/index.ts"] }
}
```

Barrel only — there is deliberately no `@ds/*`, so the vendored internals cannot be imported.

**4 · Wire the DS providers around the screen, and import from `@ds`:**

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NuriThemeProvider, OverlayProvider, View, Text, Button } from '@ds';

<SafeAreaProvider>
  <NuriThemeProvider mode="light" accent="neutral">
    <OverlayProvider>
      {/* the screen subtree — DS tokens rule inside, legacy designSystem.ts outside */}
    </OverlayProvider>
  </NuriThemeProvider>
</SafeAreaProvider>
```

Adopt per screen, not app-wide: wrap each screen/modal you convert; untouched screens keep the
existing styling. (Add the scoping rule to nuri-expo's CLAUDE.md so nobody "fixes" DS screens
back to `COLORS.*`.)

Provider ownership:

- `SafeAreaProvider` is the app/Expo provider from `react-native-safe-area-context`.
- `NuriThemeProvider` scopes the DS theme payload.
- `OverlayProvider` is required for DS overlays such as `BottomSheet`; place it inside the theme
  provider and above the safe-area-padded screen content, as shown in `App.tsx`.

No extra package is required for this probe shape: `react-native-safe-area-context` is already in
this app's dependency list and is part of the nuri-expo stack being mirrored.

## Verifying (what this repo runs per DS release)

```bash
npm run typecheck                               # TS 5.8 + nuri-expo strict flags
npx expo export --platform web --platform ios   # Metro resolution + Hermes bundle
npm run web                                     # render: screen + sheet (detents, scrim dismiss)
npm run ios                                     # native: animation feel, keyboard, safe area
```

`App.tsx` is the probe shell — safe-area ownership, theme provider placement, overlay provider
placement, and the copied playground-parity DS demo. Treat it as the reference for DS usage
patterns.
