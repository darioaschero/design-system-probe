# design-system-check

First-pass consumer validation of [`nuri-com/nuri-design-system`](https://github.com/nuri-com/nuri-design-system)
against the actual product surface (the nuri-expo wallet UX), running
as an Expo SDK 56 app that builds identically to iOS, Android, and
web.

**Primary deliverable: [`SPEC-FEEDBACK.md`](./SPEC-FEEDBACK.md)** —
16 gaps logged in the upstream `docs/RISKS.md` / FRICTIONS.md format
so each entry can fold directly back into the DS register.

## What this is

A standalone consumer, not a feature spike. The job is to answer:
**does the DS, as it ships today, port to a real Expo app cleanly
enough that a wider migration is worth doing?** The answer comes
from observing what the consumer can and can't compose using the DS
verbatim, then logging the gaps as concrete, actionable feedback
to the DS team.

The consumer composes:

- **WalletScreen** — hero balance with tap-to-hide, Receive + Send
  primary actions, centered vertically between Topbar and TabBar
- **HistoryScreen** — recent transactions as a DS `<List>` of
  `<InteractiveListItem>`s with `<IconAvatar>` leading + amount/status
  trailing
- **CoinScreen** — placeholder for the third TabBar destination
- **ReceiveModal** — choice (Bank · Crypto) → detail view with back
  affordance, close x-circle, EUR transfer details or Gnosis address
  + warning pill
- **SendModal** — choice (Bank · Crypto · Buy Bitcoin) → form with
  RN TextInput fields wrapped in DS chrome, submit Button at scroll-end
- **App.tsx** — single `NuriThemeContext.Provider` at root, `<TabBar>`
  as real navigator (decision 56's "router-agnostic destination
  switcher" framing validated end-to-end), local modal overlay
  pattern (consequence of F-MODAL-1)

Theming is fixed `{ mode: 'light', accent: 'lilac' }` per the
playground my-vault.html. Dark mode + accent switching tested by
flipping the value at `App.tsx`.

## File layout

```
App.tsx                                       App root · theme + nav + modal portal
src/
  ds/index.ts                                 single import surface (barrel) over vendored DS
  screens/
    WalletScreen.tsx                          hero balance + Receive/Send (centered group)
    HistoryScreen.tsx                         transactions list
    CoinScreen.tsx                            placeholder for the middle tab
    modals/
      ReceiveModal.tsx                        choice → bank/crypto detail
      SendModal.tsx                           choice → bank/crypto/buy_btc forms
  components/
    Sheet.tsx                                 LOCAL modal-chrome wrapper (DS gap workaround · F-MODAL-1)
  types/
    react-native-svg-shim.d.ts                LOCAL module augmentation (F-TYPESCRIPT-SVGXMLPROPS)
vendor/nuri-design-system/                    VERBATIM SNAPSHOT of upstream at the SHA noted in SPEC-FEEDBACK
  build/...                                   5 root files + 8 component files
  docs/migration-tests/button-matrix/*.tsx    20 RN mirrors, unchanged
SPEC-FEEDBACK.md                              16 gaps · format aligned to upstream RISKS.md
```

## Run

```sh
npm install
npm run web      # opens http://localhost:8081 in a browser
npm run ios      # requires Xcode + iOS simulator
npm run android  # requires Android Studio + emulator
```

## Verify

```sh
npx tsc --noEmit                                              # type-check
npx expo export --platform web --output-dir /tmp/build        # full web bundle (~487 KB)
```

## Navigating the feedback

Start with [`SPEC-FEEDBACK.md`](./SPEC-FEEDBACK.md). The format
of each entry mirrors `docs/RISKS.md` R1 frictions in the
upstream repo: gap / where / web mechanism / RN reality /
workaround in consumer / fix proposed / target.

The gaps that block real product work (sorted by impact):

| # | Code | What it blocks |
|---|---|---|
| 1 | **F-MODAL-1** | No Modal/Sheet/Dialog primitive. Every nuri-expo product surface (~28 modals across wallet/card/bitcoin) depends on this. |
| 2 | **F-TEXTINPUT-1** | No text input primitive. Every form (send, IBAN recipient, Mercuryo buy, KYC) blocks. |
| 3 | **F-BUTTON-COLUMN-FILL-1** | DS Button has `flex: 1` baked into its base StyleSheet. A standalone Button in a column Stack alongside `<Spacer grow>` balloons to fill remaining vertical space. |
| 4 | **F-TOPBAR-DEFAULT-START-COLLAPSE-1** | Topbar default-mode TopbarStart region collapses to width 0 (`flex: 0` on side region View) → back IconButton overlaps centre title. Only visible the moment a consumer builds any multi-step modal. |
| 5 | **F-FONT-CROSS-PLATFORM-1** | Font families exist in DS CSS but are deliberately not emitted to `build/tokens.ts`. RN-target consumer wanting "looks identical across iOS/Android/web" has no in-DS lever. |
| 6 | **F-DOCS-FONT-DISCOVERABILITY-1** | Meta-finding: the font story is correct in `RISKS.md` / `decisionlog.md` but four prior consumer-facing docs imply "no font story" before reaching the canonical answer. Caused my own initial mis-reading. |
| 7 | **F-FOCUS-RN-WEB-1** | Refinement of F-FOCUS-1 (the upstream entry only addresses native RN; RN-Web shows browser-default focus rings, defeating cross-platform 1:1). |
| 8 | **F-SHEET-ACTION-SLOT-1** | No convention for form-action button placement on a Sheet — sub-finding tied to F-MODAL-1's primitive shape. |
| 9 | **F-SEPARATOR-ROW-1** | `<Separator />` has no `flex`/`width` so it collapses in a horizontal Stack. Playground my-vault's swap-row composition cannot be reproduced in RN. |
| 10 | **F-PENDING-INDICATOR-1** | No DS Spinner / Banner / status-pill primitive. Wallet pending state, warning banners, etc. have no path. |
| 11 | **F-BADGE-1** | No notification badge primitive. Unread counts on Topbar IconButtons aren't expressible. |
| 12 | **F-PRESSABLE-TYPOGRAPHY-1** | Typography has no `onPress`. Tap-to-toggle balance hide requires `<Pressable>` wrapping. |
| 13 | **F-ICON-MISSING-1** | 17-glyph registry lacks common wallet glyphs (bank, paperplane, eye, directional transaction arrows). |
| 14 | **F-BUTTON-CHILDREN-1** | `Button.children: string` blocks both icon-in-label AND natural JSX interpolation (`Send € {amount}` must be `{`Send € ${amount}`}`). |
| 15 | **F-STACK-2XS-GAP-1** | `Stack.gap` exposes 5-leaf subset (xs..xl); `2xs` (2px) and `2xl` (36px) ship in `space` but aren't exposed as Stack values. |
| 16 | **F-TYPESCRIPT-SVGXMLPROPS** | DS's `_shared.tsx` imports `SvgXmlProps` but `react-native-svg` exports `XmlProps`. Local module-augmentation `.d.ts` patches it; should be a one-line type-name alignment in `_shared.tsx`. |
| 17 | **F-VENDORING** | No published consumer package. Every consumer copies + preserves upstream directory layout. |
| 18 | **F-TEXTINPUT-SIZE-SCALE-1** | Sub-finding of F-TEXTINPUT-1: TextField primitive should expose size scale matching Button (lg=60 / md=48 / sm=36) so fields align visually with submit buttons. |

(Some entries roll up into others, hence "16 gaps" rather than 18 — the rolled-up ones live under their parent.)

Active workarounds in the consumer codebase carry a unified comment:

```tsx
/*
  DS-GAP F-XYZ-1 · short description
  Workaround: what we did
  Revert: specific action when fix lands
  See SPEC-FEEDBACK.md#f-xyz-1
*/
```

`grep -rn "DS-GAP F-" src/ App.tsx` returns every revert site.

## Validating dark mode / accent switching

Edit `App.tsx`:

```tsx
const THEME: NuriThemeValue = { mode: 'dark', accent: 'neutral' };
```

then reload. No in-app toggle by design.

## Re-vendoring upstream

```sh
rm -rf vendor/nuri-design-system
git clone --depth 1 https://github.com/nuri-com/nuri-design-system tmp
mkdir -p vendor/nuri-design-system/build vendor/nuri-design-system/docs/migration-tests
cp -r tmp/build vendor/nuri-design-system/
cp -r tmp/docs/migration-tests/button-matrix vendor/nuri-design-system/docs/migration-tests/
rm vendor/nuri-design-system/docs/migration-tests/button-matrix/react-native-svg.d.ts
rm -rf tmp
npx tsc --noEmit                  # confirm the consumer contract still holds
```

If `tsc` fails after re-vendor, the diff is the consumer-visible
breaking change. F-VENDORING covers this: a published package would
catch it at `npm install`, not weeks later.

## Phases

- **Phase 1 (this commit):** composition + interactive flows.
  Hardcoded values. Validates DS components, theming context,
  cross-platform bundling, modal/form composition patterns. The
  gaps logged here are visible without wiring any service.
- **Phase 2 (future):** wire real services from nuri-expo —
  read-only paths first (balances, KYC status, transaction feed).
  Expected to surface a different class of gap (runtime-layout
  behaviours the type-only test in the upstream
  `docs/migration-tests/button-matrix/` was structurally blind to;
  RISKS R5 predicted these).
