# SPEC-FEEDBACK · nuri-design-system

Findings from building a one-screen Wallet consumer (`src/screens/WalletScreen.tsx`)
against the vendored DS at commit `0b3f97a1`. Each entry follows the
FRICTIONS.md / RISKS.md R1 format so it can be folded directly into
the upstream register.

**Scope of this report.** Phase 1 (design only). The consumer is a
fresh `npx create-expo-app -t blank-typescript` (Expo SDK 56, RN 0.85,
React 19) targeting iOS + Android + web identically.

Three screens are wired against a single `<TabBar>` navigator at the
App root (validating decision 56's destination-switcher claim end-to-end):

- **WalletScreen** — fresh rebuild of nuri-expo's wallet UX. Hero
  balance with tap-to-hide, pending pill, Details + Send actions,
  Buy Bitcoin shortcut. Single home currency (no switcher · no
  rotation — operator confirmed neither exists in nuri-expo's
  shipped UX).
- **HistoryScreen** — recent transactions list. The "clock" tab.
- **CoinScreen** — placeholder for the middle "coin-vertical" tab.

No nuri-expo layout primitives were borrowed; the vendored DS
components are consumed unchanged. No services / business logic
are wired yet (Phase 2).

The DS playground (`playground/my-vault.html`) informed layout
patterns (Topbar + Scroll + bottom actions, list-with-separators
rhythm) — surfaced its own gaps before the wallet rebuild started
(`F-SEPARATOR-ROW-1`, `F-BUTTON-CHILDREN-1`). The wallet rebuild
surfaced additional gaps specific to a real product screen
(`F-SCROLL-REFRESH-1`, `F-BADGE-1`, `F-PENDING-INDICATOR-1`,
`F-PRESSABLE-TYPOGRAPHY-1`, `F-ICON-MISSING-1`).

---

## F-SEPARATOR-ROW-1 · Separator has no intrinsic horizontal extent

- **Gap.** `<Separator />` is `View { height: 1, alignSelf: 'stretch' }`.
  In a horizontal Stack (`direction="row"`) the cross axis is vertical,
  so `alignSelf: 'stretch'` only stretches it to 1px tall (it already
  is). It has no `flex` / `flexGrow` / `width`, so it collapses to
  width 0 and disappears.
- **Where.** `playground/my-vault.html` uses the pattern verbatim:
  ```html
  <nuri-stack direction="row" gap="sm" align="center">
    <nuri-separator y-space="none"></nuri-separator>
    <nuri-icon-button name="arrows-down-up" ...></nuri-icon-button>
    <nuri-separator y-space="none"></nuri-separator>
  </nuri-stack>
  ```
  The same composition in RN renders the IconButton centred with
  no visible flanking lines.
- **Web mechanism.** `display: block` (or whatever the custom-element
  defaults to) gives full inline width inside a flex row. The web
  Separator gets the swap-row line "for free."
- **RN reality.** `View` has zero intrinsic dimensions; no `flex` is
  set on Separator. The web's "block elements fill inline space"
  does not translate.
- **Workaround in consumer.** Wrap each Separator in a
  `<View style={{ flex: 1 }}>`. Verbose; couples the consumer to a
  layout detail that the DS primitive should own.
- **Fix proposed.** One of:
  - (A) Add a `fill?: boolean` (or `grow?: number`) prop to Separator
    that sets `flex: 1` (and probably swaps `height: 1` for a
    direction-aware `block-size: 1`). Symmetric with the existing
    `fill` on Box/Stack.
  - (B) Make Separator inherit row/column orientation from its parent
    Stack via context, and pick width/height accordingly.
  - (C) Document explicitly on `pages/components/separator.html` that
    horizontal-row flanker usage requires a Spacer/Box wrapper, with
    the recipe shown.
- **Target.** Worth a DS session — this is a real playground composition
  that the spec validates on web but not RN. n=1.

---

## F-BUTTON-CHILDREN-1 · Button children typed `string`, blocks icon-in-label AND JSX interpolation

- **Gap.** `ButtonProps.children: string`. The playground's Apple Pay
  fund-action composes a nested layout inside the button:

- **Secondary surface** (observed building Send sub-flows). The
  `string` constraint also rejects natural JSX interpolation:
  ```tsx
  <Button>Send € {amount}</Button>          // ERROR · children: string[]
  <Button>{`Send € ${amount}`}</Button>     // OK · explicit template literal
  ```
  Every dynamic-label button needs the template-literal escape. Not
  fatal but constant friction — and a real "WTF" moment for any new
  consumer trying the natural JSX form.
  ```html
  <nuri-button variant="solid" size="lg">
    <nuri-stack direction="row" gap="xs" align="center">
      Buy Bitcoin with<nuri-icon name="apple-logo" size="sm" fill></nuri-icon>Pay
    </nuri-stack>
  </nuri-button>
  ```
  The RN Button signature rejects this at the type layer.
- **Where.** `vendor/.../button-matrix/button.tsx` lines 39–47;
  `pages/components/button.html` Roadmap → "v1.x · Icon in label
  (planned)".
- **Web mechanism.** Custom element accepts arbitrary slot content;
  the inner `<button>` uses `display: flex` so child layout works.
- **RN reality.** The inner `<Text>` only renders strings or nested
  `<Text>`. Mixing inline icons into a Button label needs either
  a different component shape (children: ReactNode + an explicit
  text-stripping pipeline for accessibilityLabel) or first-class
  `leading?: IconName` / `trailing?: IconName` props.
- **Workaround in consumer.** Text-only label
  ("Buy Bitcoin with Apple Pay") — loses the brand glyph the playground
  asserts is essential.
- **Fix proposed.** Add `leading?: IconName` + `trailing?: IconName`
  props on Button (and IconButton already has its glyph). This is
  decision 38's `currentColor` + decision 48's typed `IconName`
  composing cleanly, no new tokens. Less invasive than widening
  `children` to `ReactNode`.
- **Target.** v1.x is already on the Roadmap — flagging that the
  playground itself depends on this; until it ships, the playground
  composition cannot be ported to RN truthfully.

---

## F-FONT-CROSS-PLATFORM-1 · Web-side font tokens exist but aren't emitted to RN

- **What's actually shipped.** The DS DOES define font families — on
  the web side. `styles/tokens-primitive.css` declares three
  primitives:
  ```css
  --nuri-font-family-sans:    system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --nuri-font-family-mono:    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --nuri-font-family-display: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```
  Plus per-platform preview overrides (`[data-font="ios"]`,
  `[data-font="android"]`, `[data-font="pixel"]`) for the playground
  device-picker. `styles/shell.css:21` applies sans globally on web.
- **The gap.** These three primitives are NOT in `build/tokens.ts`.
  Grep confirms zero `fontFamily` mentions in any emitted RN artefact.
  Per decision 27 amendment 27.1: "font is web-only — emulation overlay
  for the docs. On RN the platform supplies its own system font stack
  natively; no `font` prop migrates, no `Font` type ships." Per the
  F-FONT-1 operator note (2026-05-31): "Web uses test font on purpose
  — preview how iOS/Android render; RN uses the platform system font.
  No shared `--nuri-type-family` token by design."
- **Why it bites this consumer.** "Looks identical across iOS / Android
  / web" was an explicit operator requirement for this spike. The
  RN-target export doesn't expose the existing web font stack, so even
  though `system-ui` would resolve cleanly on web AND with explicit
  loading on native (via `@expo-google-fonts/roboto` or similar), the
  consumer has no in-DS lever.
- **Workaround in consumer.**
  - (A) Accept platform-default fonts and the resulting cross-platform
    delta. Chosen for Phase 1 of this spike — visible as the screenshot
    you took.
  - (B) Modify vendored `typography.tsx` to read a `fontFamily` from a
    parallel context. Forks the DS; rejected per Taner's rule 5.
  - (C) Load Roboto via `@expo-google-fonts/roboto` (already a
    dependency, unused) + wrap the tree in a Text style. RN `<Text>`
    inheritance through `<Pressable>` / `<View>` doesn't propagate, so
    this would miss most DS components.
- **Fix proposed.**
  1. Emit `fontFamily.sans / mono / display` to `build/tokens.ts`
     from the existing `--nuri-font-family-*` primitives. The CSS
     values port verbatim — `system-ui` resolves on every platform
     RNW supports.
  2. Add `fontFamily?: { sans?: string; mono?: string; display?: string }`
     (or just `fontFamily?: string` for the simple case) to
     `NuriThemeValue`. Unset → current behaviour. Opt-in.
  3. DS Typography reads `useContext(NuriThemeContext).fontFamily`
     and spreads into the Text style. Same pattern for Button +
     Topbar (the other text-bearing components).
- **Target.** **Promote from "parked" to "ship next session"** —
  parked was correct when no consumer was identified; this spike IS
  that consumer. The change is mechanical: existing CSS values, new
  emit + new optional context field. Zero risk to consumers wanting
  platform-native fonts (just don't set the field).

---

## F-TYPESCRIPT-SVGXMLPROPS · `react-native-svg` real-package surface check

- **Gap (verified at install).** `_shared.tsx` does
  `import type { SvgXmlProps } from 'react-native-svg'`. The
  vendored migration-test repo declares this via a local
  `react-native-svg.d.ts` shim. When the real package is installed
  (this spike), tsc may not find `SvgXmlProps` as a named export
  depending on the installed version (the package's public type
  name has historically been `XmlProps` in some versions).
- **Status in this spike.** Pending verification — flagged proactively
  because decision 48's "swap is mechanical when the real package
  lands" assumes the type name matches. If tsc errors, the resolution
  is a one-line type alias inside `_shared.tsx` (or the real package
  needs to be pinned to a version that exports `SvgXmlProps`).
- **Fix proposed.** Either (A) state the supported version range
  of `react-native-svg` on `pages/components/iconography.html` and
  in `prompts/migration-test.md`, or (B) localise the type with
  `type SvgXmlProps = React.ComponentProps<typeof SvgXml>` in
  `_shared.tsx` so consumers don't import a type the package may
  rename.

---

## F-DOCS-FONT-DISCOVERABILITY-1 · The font story is fragmented across docs

- **Meta-finding** (not a code gap — a documentation gap).
  I (the migration agent) initially concluded "the DS doesn't define
  any fontFamily" and logged F-FONT-CROSS-PLATFORM-1 on that premise.
  After the operator pushed back, I went back to the source and found
  three `--nuri-font-family-*` primitives in `styles/tokens-primitive.css`,
  a global `font-family: var(--nuri-font-family-sans)` in
  `styles/shell.css:21`, and a `[data-font="ios|android|pixel"]`
  platform-preview overlay. The information IS there — but no single
  document tells an RN-target consumer the full story. The pieces
  that exist:
  1. **`pages/foundations/typography.html`** — has a "Font family is
     out of scope" paragraph plus a Roadmap item ("Lock the
     font-family source of truth · planned"). Reads as "we haven't
     decided yet."
  2. **`styles/tokens-primitive.css`** — has the actual values plus a
     comment "[data-font='...'] overrides below are preview-only for
     the docs." Authoritative but invisible to anyone consuming
     `build/*` only.
  3. **`docs/RISKS.md` F-FONT-1** — the operator note from 2026-05-31
     explains the DELIBERATELY PARKED decision: "Web uses test font;
     RN uses platform system font; no shared `--nuri-type-family`
     token by design. Gate: when a real component needs the **mono**
     family." This is the canonical answer but it's friction #N in a
     long register.
  4. **`decisionlog.md` amendment 27.1** — "font is web-only emulation
     overlay; no `Font` type ships." This is the lock; lives in
     spec-authoring history, not consumer docs.
- **What an RN consumer actually reads.** Per Taner's recommended
  navigation order (his message · 2026-06-01):
  > 1. llms.txt — concise map · best first file
  > 2. README.md — repo shape · pipeline overview
  > 3. pages/implementation-guide.html — web→RN migration model
  > 4. pages/components/scope.html — theming / scope model
  > 5. Specific component page — API · token mapping · deltas
  > 6. Generated build files — consumed artifacts
  > 7. docs/RISKS.md — known frictions
- **What goes wrong on that path:**
  - `llms.txt` lists `build/tokens.ts` as the RN-ready runtime sets
    surface; says "Source of truth: this repo's `styles/` CSS files.
    HTML pages and build assets are derived." Doesn't flag that
    some primitives in `styles/` are intentionally NOT derived to
    `build/`. An RN consumer reading llms.txt treats build/* as
    complete.
  - `pages/implementation-guide.html` enumerates what migrates
    (tokens, components, behavioural deltas). There's no
    "**What is web-only and does NOT migrate**" section. The
    "Out of scope" section at the bottom names Style Dictionary
    and Unistyles theme registry — not font.
  - `build/tokens.ts`'s file header lists every group it ships
    (chrome / accent / space / size / radius / type) but doesn't
    say "fontFamily is intentionally omitted — see
    `styles/tokens-primitive.css --nuri-font-family-*` for the
    web-side definitions and F-FONT-1 for the rationale." An RN
    consumer reading this header concludes "if it's not here, it
    doesn't exist."
  - `pages/components/scope.html` lists what NuriThemeContext
    carries (`mode`, `accent` · reserved `density`, `neutral`).
    Doesn't address fontFamily. Implies fontFamily is not a context
    concern at all — when actually amendment 27.1 says exactly that.
  - `RISKS.md` is in the recommended order — but at position 7,
    after the consumer has already concluded fonts aren't in scope
    based on the earlier surfaces. By the time they read F-FONT-1
    they've already missed it (as I did).
- **Fix proposed.** Three small surface-level additions:
  1. **Add a "What does NOT migrate" section to
     `pages/implementation-guide.html`** — explicit enumeration:
     fontFamily, font-overlay attributes (`[data-font="ios"]` etc.),
     CSS cascade-only patterns, web-only `<nuri-scope font>` prop.
     Each item links to the rationale (F-FONT-1, amendment 27.1).
  2. **Add a header note to `build/tokens.ts`** listing what's
     intentionally NOT here and where to look. One sentence per
     omitted primitive family.
  3. **In `pages/foundations/typography.html`**, replace the soft
     "Font family is out of scope" paragraph + Roadmap "planned"
     with the actual operator decision (parked, gated on mono
     consumer, see F-FONT-1). The current copy implies undecided;
     the reality is decided-and-deferred.
- **Target.** Three small doc edits, no code change. The cost of
  the current gap is that consumers either miss it (logging
  incorrect feedback like my initial F-FONT-CROSS-PLATFORM-1
  framing) or implement workarounds that diverge from the DS's
  intent.

---

## F-VENDORING · No published consumer package

- **Gap.** The DS ships generated `build/*` + reference RN mirrors
  under `docs/migration-tests/button-matrix/`, but no `package.json`
  consumer entry. Consumers vendor by copy (this spike) or git
  submodule. The mirror files' import paths (`../../../build/...`)
  assume the upstream directory structure; consumers must preserve
  it or rewrite imports.
- **Workaround in consumer.** Vendor verbatim at
  `vendor/nuri-design-system/` preserving the upstream layout, then
  re-export through a barrel (`src/ds/index.ts`).
- **Fix proposed.** Publish `@nuri/design-system` to a registry
  (or as a git tag consumable via `npm install
  github:nuri-com/nuri-design-system#v0.1.0`). Entry exports the
  components + build artifacts under flat paths
  (`@nuri/design-system/{Button, tokens, NuriThemeContext}`). Until
  then, document the vendoring procedure on the README.
- **Target.** Process work, not a primitive change. Worth flagging
  because the vendoring step is the first thing any consumer hits.

---

## F-MODAL-1 · No Modal / Sheet / Dialog primitive

- **Gap.** The DS ships zero overlay primitives. `llms.txt` lists no
  Modal / Sheet / Dialog / Drawer / Toast / Tooltip. Every nuri-expo
  product surface uses modals heavily:
  - `WalletDetailsModal`, `WalletSendChoiceModal`,
    `WalletSendStablecoinModal`, `WalletIbanRecipientModal`,
    `WalletIbanAmountConfirmationModal`, `MoneriumBridgeModal`,
    `MoneriumAutoBridgeModal`, `MoneriumTransactionsModal`
    (wallet alone)
  - `CardDetailsModal`, `CardLimitModal`, `CardSourceOfFundsModal`,
    `CardTopUpWithStablecoinModal`, `CardTransactionsModal`,
    `ConfirmPhysicalCardOrderModal`, `GnosisPayRegistrationModal`,
    `VerifyPhoneModal`, `AppleWalletModal` (card)
  - `BitcoinReceiveModal`, `BitcoinSendChoiceModal`,
    `BitcoinSendScreen`, `BitcoinTransactionsModal`,
    `BitcoinTransactionSummaryModal`, `BitcoinCheckSequenceVerifyCSVRecoveryScreen`,
    `MercuryoBuyBitcoinModal`, `NativeMercuryoApplePayModal` (bitcoin)
  - Plus generic `QrScannerModal`, `GenericSuccessModal`,
    `SupportModals`, `ModalSheet` (the shared chrome itself).
- **Where.** All product screens. A wallet rebuild that surfaces the
  Receive/Send actions cannot complete Phase 1 without overlay UI.
- **Web mechanism.** N/A — overlay semantics differ enough across
  platforms that the DS itself needs to take a position.
- **RN reality.** RN ships `<Modal>` (full-screen presentation) but no
  bottom-sheet, no drag-to-dismiss, no themed chrome. Third-party
  libs (`react-native-modal`, `@gorhom/bottom-sheet`,
  `react-native-portalize`) compete here; the DS picking one would
  resolve consumer fragmentation.
- **Workaround in consumer.** Built `src/components/Sheet.tsx` +
  modal-state ownership in App.tsx with an absolutely-positioned
  root-level View overlay.
  - **First attempt** (rejected): wrapped RN's built-in `<Modal>` —
    slides up natively on iOS / Android, CSS-shimmed on web,
    presentation-style differs by platform. Failed the
    cross-platform 1:1 requirement.
  - **Current**: Sheet is just chrome (SafeAreaView + DS Screen +
    Topbar + close IconButton). Visibility is managed at App.tsx,
    and the active Sheet is rendered as a `position: absolute,
    top/bottom/left/right: 0` View placed LAST in tree order so
    RN's draw order paints it above the TabBar. Zero native
    overlay APIs touched. Identical iOS / Android / web.
  - **Costs of the workaround:** no slide animation, no Android
    hardware-back close, no web ESC-to-close, no backdrop tap. The
    user closes via the Topbar close IconButton only.
- **Fix proposed.** A DS `<Sheet>` primitive shaped like:
  ```tsx
  <Sheet
    open={open}
    onClose={...}
    variant="full" | "bottom" | "center"
    title?
    actions?: ReactNode  // optional trailing action slot in topbar
  >...
  ```
  with the existing Topbar composable in the chrome slot. The
  three variants cover the cases existing nuri-expo modals use
  (full-screen confirm flows, bottom-sheet pickers, center-anchored
  alerts). Animation, backdrop, dismiss gestures (Android back,
  web ESC, swipe-down on `bottom`), and safe-area concerns owned by
  the primitive, not the consumer.
  - **Cross-platform 1:1 is a hard constraint** for this consumer.
    The Sheet primitive should NOT rely on RN's built-in `<Modal>`
    (whose presentation diverges per platform); instead use the
    same absolute-View overlay pattern shown in `App.tsx` here,
    plus an `Animated` slide using `useNativeDriver: true` (which
    DOES behave identically across platforms — RN-Web supports
    opacity + transform animations).
  - **Portal mechanism.** The consumer here had to lift modal
    state to App.tsx and render at root level. A DS `<SheetPortal>`
    (or `ModalProvider` Context) would let any descendant open a
    Sheet without prop drilling. Lower priority than the primitive
    itself but worth shipping together.
- **Target.** **Highest priority of all findings in this report.**
  Without an overlay primitive, every consumer reinvents this surface
  (often inconsistently) — exactly the divergence the DS exists to
  prevent. Recommend the next DS session ship `Sheet` + (optional)
  `SheetPortal` as the first Tier-2 overlay primitive.

---

## F-SCROLL-REFRESH-1 · Scroll does not forward `refreshControl`

- **Gap.** `<Scroll>` renders `<ScrollView style={{ flex: 1 }}>` and
  takes only `children` + `style`. There is no path to attach a
  pull-to-refresh `RefreshControl`. nuri-expo's `BalanceScreenLayout`
  always wires one for the wallet's refresh-balance flow; any real
  app consumer hits this immediately.
- **Where.** `vendor/.../button-matrix/scroll.tsx`. Header comment
  says "padding for the content goes on a `<Box fill>` CHILD" — the
  RefreshControl pattern isn't addressed.
- **Web mechanism.** N/A — pull-to-refresh is a native idiom.
- **RN reality.** `ScrollView` accepts `refreshControl?: React.ReactElement`
  natively. Forwarding it on Scroll is one prop pass-through.
- **Workaround in consumer.** Don't ship pull-to-refresh in Phase 1.
  Phase 2 would have to either monkey-patch the vendored Scroll or
  use a raw `ScrollView` and lose the DS abstraction.
- **Fix proposed.** Add `refreshControl?: React.ReactElement<RefreshControlProps>`
  to `ScrollProps`. Single-line passthrough in the implementation.
  Web target degrades cleanly (RN-Web ignores `refreshControl` props).
- **Target.** Tiny DS change with high consumer value.

---

## F-BADGE-1 · No notification badge primitive

- **Gap.** nuri-expo's `ScreenHeader` shows a `<NotificationBadge>`
  on the support button when there are unread support messages. DS
  ships no badge / dot / counter primitive. IconButton and Topbar
  do not surface a badge slot.
- **Where.** Common UX everywhere — tab badges (TabBar), chat
  unread, transaction-count notifications. Currently no way to
  express in the DS.
- **Web mechanism.** Custom CSS pseudo-element on the icon button
  in most design systems; not on the DS.
- **RN reality.** Trivial absolute-positioned `View` over the
  IconButton's circle, but the DS provides no recipe.
- **Workaround in consumer.** Drop the badge for Phase 1. (Documented
  in the IconButton call site in `WalletScreen.tsx`.)
- **Fix proposed.** Either (A) a standalone `<Badge count={n}>`
  primitive author-placed via absolute positioning over any
  IconButton; or (B) an optional `badge?: number` prop on
  IconButton that paints the dot in the upper-right of the 48px
  circle using `accent.solid` / `accent.onSolid`. (B) is more
  scoped, (A) generalises better.
- **Target.** New primitive — surface area decision worth Dario's call.

---

## F-PENDING-INDICATOR-1 · No Spinner / status pill primitive

- **Gap.** No DS analogue to nuri-expo's `Spinner`,
  `FloatingTransactionStatus`, or any inline "operation in progress"
  signal. A wallet screen needs both:
  - **Spinner** — a small spinning indicator beside an amount or
    button label.
  - **Status pill / banner** — a horizontal pill showing
    "Pending tx · €24.00 · tap to view" (sticky bottom or inline).
- **Where.** Real product screens (wallet, card, bitcoin) all rely
  on these. None of the 8 emitted DS components (button, icon-button,
  switch, tabs, tab-bar, list, list-item, list-interactive-item)
  fits.
- **Workaround in consumer.** Approximated the status pill with
  `Box background="accent-subtle"` + `Icon name="clock"` +
  `Typography`. Crude — no animation, no semantic "pending" colour
  token. A real consumer needs more.
- **Fix proposed.**
  - **Spinner** as a foundation primitive (no tokens, just SVG
    animation over `chrome.borderStrong` or `accent.solid`).
  - **StatusPill** as a Tier-2 leaf with variants `pending` /
    `success` / `warning` / `error` mapping onto existing
    `accent-subtle` / status colour primitives (the Jade/Amber/Red
    family flagged in RISKS.md R3 / N+5.7 cleanup).
- **Target.** Spinner is the lowest-hanging fruit; status pill is
  larger and may want its own session.

---

## F-BUTTON-COLUMN-FILL-1 · Button has `flex: 1` baked into its base style

- **Gap.** `vendor/.../button-matrix/button.tsx:170` declares
  ```ts
  const styles = StyleSheet.create({
    base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flex: 1 },
  });
  ```
  The `flex: 1` is intentional for the "two Buttons side-by-side in a row
  split 50/50" case (Details + Send in the wallet · Pay + Cancel in the
  matrix demo). But when a standalone Button lands as a direct child of a
  COLUMN Stack — especially alongside a `<Spacer grow={n}>` — the Button's
  `flex: 1` competes with the Spacer's `flex: n`, and the remaining
  vertical space is split between them. Result: the Button stretches to
  fill a huge fraction of the screen.
- **Where.** First observed on the Wallet screen's "Buy Bitcoin" CTA
  placed directly in the outer column Stack. The button reached ~50%
  of viewport height with the standard `<Spacer grow={1}>` underneath.
  Reproduced on web via `npm run web`.
- **Web mechanism.** On web `display: flex` in a column container has
  children whose `flex` defaults to `0 1 auto` — they don't stretch
  along the main axis unless explicitly told to. The web `.nuri-button`
  CSS does NOT include `flex: 1` (it relies on author-placed
  `.playground-stretch` or similar utilities). So the playground
  my-vault.html buttons sit at their intrinsic min-height naturally.
- **RN reality.** RN children in a flex column also default to
  `0 1 auto`, BUT the Button has `flex: 1` written in its base
  StyleSheet, forcing growth. The asymmetry: the web Button's CSS and
  the RN Button's StyleSheet behave differently for the same
  composition. This is a 1:1 prop layer ✓ / behaviour layer ✗ case
  per RISKS R1.
- **Workaround in consumer.** Wrap standalone Buttons in a row Stack:
  ```tsx
  <Stack direction="row">
    <Button variant="soft" size="md">Buy Bitcoin (€ → ₿)</Button>
  </Stack>
  ```
  The Button's `flex: 1` now operates on the row's horizontal axis
  (fills width) while vertical sizing falls back to its baked-in
  `minHeight` (lg=60, md=48, sm=36). Discoverable only after the
  layout breaks — no DS-side hint.
- **Fix proposed.**
  - (A) Remove `flex: 1` from `styles.base`. Consumers wanting
    side-by-side split add `flex: 1` themselves, or use a layout
    primitive prop. Aligns with web. Breaking change for the
    matrix demo (Pay + Cancel rows would shrink to content
    width) but matches web behaviour.
  - (B) Add a `fill?: boolean` prop to Button (default false; existing
    behaviour). Consumers explicitly opt in for the row-split case:
    `<Button fill>Pay</Button>`. Backward-compatible only if (A)
    happens first, otherwise both share the same default.
  - (C) Detect parent context — not feasible without React Context
    + a layout-aware Stack.
  - Recommended: **(A) + breaking-change note in the migration
    guide.** The current behaviour is a hidden footgun.
- **Target.** High-leverage DS fix. The web↔RN behavioural delta on
  Button is wide enough to break the first real consumer screen built
  in column-first layout — i.e., almost any product screen.

---

## F-TOPBAR-DEFAULT-START-COLLAPSE-1 · TopbarStart region collapses in default mode

- **Gap.** `topbar.tsx:111` computes `const sideFlex = center ? 1 : 0;`
  then line 126 applies `flex: sideFlex` to the start region View. In
  default (non-`center`) mode this resolves to `flex: 0` on the start
  region, which in RN/RN-Web means `flexBasis: 0, flexGrow: 0,
  flexShrink: 0` — the region collapses to width 0. Children render
  with `overflow: visible` so a back IconButton draws at its baked-in
  48×48, but the parent View *has zero layout width*. The centre
  region (next in tree order, `flexGrow: 1, justifyContent:
  'flex-start'`) starts immediately after a 0-width start + 6px gap,
  so its title Text renders on top of the IconButton.
- **Where.** First observed building this spike's Receive flow with a
  caret-left back button in the Topbar's start slot of a Sheet. Title
  "Bank transfer" overlapped the back IconButton on web (see screenshot
  attached to operator message 2026-06-03). The DS playground
  `my-vault.html` never exercises this case (no back affordance);
  `app.tsx`'s `TopbarDemo` only puts a back button in `center` mode
  (the Cancel/Edit/Save bar). So the regression has no in-DS test.
- **Why end works visually.** The end region has the same `flex: 0`
  but pairs it with `justifyContent: 'flex-end'`. The IconButton
  draws anchored to the right edge of the parent's draw area — which
  happens to align with the screen edge despite the 0-width parent.
  This is incidental, not by design.
- **Workaround in consumer.** Switch the Topbar to `center` mode
  (applied in `src/components/Sheet.tsx`). Center mode sets
  `sideFlex = 1` for both sides → both side regions take equal share,
  no collapse. Title centres (typical iOS modal look). Zero DS
  modification.
- **Fix proposed.** `sideFlex` should keep both regions content-sized
  in default mode, not zero-sized. Options:
  - (A) Drop the `flex: sideFlex` style entirely in default mode —
    let the side region View intrinsic-size to its children (RN's
    default View sizing).
  - (B) Use `flexBasis: 'auto', flexGrow: 0, flexShrink: 0` instead of
    `flex: 0`. More explicit.
  - (C) Use `width: undefined` with `alignSelf: 'auto'`. Equivalent
    outcome via different idiom.
  Recommended: **(A)** — minimum surface change, matches the
  intent in the original code comment (the side regions should just
  hug their content).
- **Target.** Bug fix in `topbar.tsx`. Three-line change. Worth a DS
  session because this is the first regression a consumer hits when
  building any non-center modal/sheet that needs a back affordance —
  which is most multi-step flows.

---

## F-FOCUS-RN-WEB-1 · RN-Web exposes browser-default focus ring; DS doesn't override

- **Refinement of F-FOCUS-1 in upstream RISKS.md.** The upstream framing
  says "RN has no DOM focus model; visual ring intentionally absent" —
  which addresses NATIVE RN. On RN-Web, RN's `<TextInput>` /
  `<Pressable>` render as HTML `<input>` / `<div tabindex>`, and the
  BROWSER paints its default focus ring (Chrome's blue 2px outline,
  Safari's blue glow, Firefox's dotted border, varies). The result is:
  - iOS native: no focus indicator at all
  - Android native: no focus indicator
  - Web (any browser): browser-default ring, varies per browser
- **Where.** Visible the moment any RN TextInput receives focus in a
  browser. Observed in the Send → crypto-address field (screenshot
  attached to operator message 2026-06-03 · blue Chrome ring around
  the focused address input).
- **Why this conflicts with cross-platform 1:1.** A consumer with the
  explicit "looks identical across iOS / Android / web" requirement
  (this spike) has THREE different focus visuals across platforms,
  one of them externally controlled (the browser). The DS owns
  nothing in this surface.
- **Workaround in consumer.** Either:
  - (A) Suppress with `outlineStyle: 'none'` (RN-Web web-only style
    prop) on every interactive element and ship nothing → consistent
    "no focus visual anywhere," but worst-of-both for keyboard a11y
    on web.
  - (B) Suppress + paint a DS-styled focus ring manually using
    `focused` state from Pressable and a custom outline View →
    expensive per-element, easy to forget on any new input.
  - (C) Accept the platform delta. Chosen for Phase 1 of this spike.
- **Fix proposed.** The DS Sheet/Button/TextField/IconButton family
  should ship a single focus-visual token (`chrome.focusRing` already
  exists in `build/tokens.ts`!) and consume it consistently:
  - Native RN: `accessibilityState.focused` only (no visual, as today)
  - RN-Web: paint `outline: 2px solid ${chrome.focusRing}` /
    `outlineOffset: 2px` on the rendered DOM node when focused
  Same primitive, branch the *rendering* not the *contract*. The
  `focusRing` token in chrome already exists — it's just unused.
- **Target.** Smallest fix in this report (the token is shipped,
  just consume it on the web branch). But it requires DS components
  to know their platform — or RN-Web's CSS-injection to handle it
  globally.

---

## F-TEXTINPUT-SIZE-SCALE-1 · No size scale for the missing TextField primitive

- **Sub-finding of F-TEXTINPUT-1** flagged separately because it
  reframes the proposed fix.
- **Where this hurts.** Without a DS `<TextField>` primitive AND
  without a published size scale matching Button's (lg=60, md=48,
  sm=36), every consumer picks a height ad-hoc from the
  `paddingY × typography` budget. This spike's first attempt landed
  at ~29px field height (`paddingY="sm" + typeStyle('md')`) — shorter
  than the smallest Button (36px), creating visual inconsistency
  between fields and the submit button in the same form.
- **Fix proposed.** The `<TextField>` primitive in F-TEXTINPUT-1
  should expose `size?: 'lg' | 'md' | 'sm'` matching Button's scale:
  - lg → 60px height (mirrors Button lg) · typeStyle('mdEm') label
  - md → 48px height (mirrors Button md · DEFAULT) · typeStyle('md')
  - sm → 36px height (mirrors Button sm) · typeStyle('sm')
  A form that mixes a md TextField + md Button should align visually
  without the consumer doing manual math.
- **Target.** Bake into the F-TEXTINPUT-1 fix when it ships. Not a
  separate primitive.

---

## F-SHEET-ACTION-SLOT-1 · No convention for form-action button placement

- **Gap.** When a Sheet hosts a form (Send → bank/crypto/buy_btc in
  this spike), the consumer needs to decide where the submit button
  goes:
  - (A) Inline at the bottom of the Scroll content (scrolls with
    body)
  - (B) Sticky to the Sheet's bottom (always visible, content
    scrolls behind)
  - (C) Pinned-above-keyboard on mobile (rises with keyboard)
  The DS ships no opinion. The DS playground `my-vault.html` is the
  only Sheet-like surface today, and its bottom buttons are pushed
  by `<nuri-spacer grow>` — pattern (A). But (A) breaks on small
  screens / keyboard-open: the button moves below the viewport.
- **Where.** Send form buttons in `SendModal.tsx` use (A). On
  desktop browser viewport (this spike's screenshots) the button
  appears bottom-pinned because content fits; on a 375px-tall iPhone
  SE with keyboard open it would scroll out of reach.
- **Web mechanism.** Web's `position: sticky` handles (B); web's
  `env(keyboard-inset-bottom)` handles (C).
- **RN reality.** RN has `KeyboardAvoidingView` for (C); sticky
  scroll behaviour can be approximated with `stickyHeaderIndices`
  on ScrollView (a hack) or a separate View outside the Scroll.
- **Workaround in consumer.** Pattern (A) chosen for Phase 1. The
  `<Spacer grow={1} />` + `<Stack direction="row">` + `<Button>`
  block at the bottom of every form puts the button at scroll-end.
- **Fix proposed.** A DS Sheet should expose a `footer?: ReactNode`
  slot (sibling to `title`/`children`) that renders the footer
  outside the scroll, sticky to the bottom edge of the Sheet, with
  built-in keyboard-avoidance on mobile. Companion convention:
  the footer is the ONE place primary form actions live.
- **Target.** Bake into the F-MODAL-1 Sheet primitive when it
  ships. Form patterns won't be consistent across consumers
  otherwise.

---

## F-STACK-2XS-GAP-1 · Stack `gap` prop missing `2xs` and `2xl`

- **Gap.** `Stack.gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
  (`SpaceLeaf` type in `_shared.tsx`). The runtime `space` set in
  `build/tokens.ts` defines eight leaves: `none, 2xs, xs, sm, md, lg,
  xl, 2xl` — but `SpaceLeaf` exposes only five. Decision 37 / 60
  intentionally clamped layout primitives to the 5-leaf subset, but
  this leaves consumers without `space.2xs` (2px) for tight
  label-above-input spacing — which `TypographyStack` itself owns
  internally as its column default. The form atoms in the Send flow
  wanted `gap="2xs"` between a `<Typography size="sm" muted>` label
  and its input row; settled for `gap="xs"` (4px instead of 2px).
- **Where.** Form sections in `src/screens/modals/SendModal.tsx`
  (`FieldGroup` atom).
- **Web vs RN.** Both sides apply the same `SpaceLeaf` clamp.
- **Workaround in consumer.** Use the next-step-up (`xs`). Or bypass
  Stack and use a manual `View` with `marginBottom: space['2xs']`
  imported from `build/tokens` — abandons the Stack API to access a
  leaf the DS already ships.
- **Fix proposed.** Either (A) widen `SpaceLeaf` to the full
  8-leaf `space` set; or (B) keep `SpaceLeaf` for the layout-primitive
  prop budget but explicitly document that consumers can fall back to
  `tokens.space.2xs` for the missing leaves; or (C) add a separate
  `gapTight?: '2xs' | 'xs'` opt-in. Recommend (A) — the existing
  5-leaf clamp predates `TypographyStack`'s landing, which itself
  uses 2xs internally.
- **Target.** One-line type widening + corresponding CSS attribute
  selectors on the web side. Small fix.

---

## F-TEXTINPUT-1 · No text input primitive

- **Gap.** The DS ships exactly one form-input primitive: `<Switch>` (a
  toggle). No TextInput, no NumberInput, no Select / Picker, no
  DatePicker, no SearchField, no AmountField. Every product screen
  that takes user typed/numeric input has no DS path.
- **Where.** First observed building the Send sub-flows: bank
  transfer needs recipient + IBAN + amount + optional reference;
  crypto needs address + amount; buy-Bitcoin needs amount. None of
  these can be composed from current DS primitives.
- **Web mechanism.** N/A — input semantics differ enough across
  platforms that the DS needs an opinion.
- **RN reality.** RN ships `<TextInput>` (native UITextField on iOS,
  EditText on Android, `<input>` on web via RN-Web). Default rendering
  diverges per platform: selection handles, autocorrect bar, focus
  outline, placeholder colour, blink rate, IME interaction. Custom
  styling can paint over MOST of this but selection UI is platform-
  managed.
- **Workaround in consumer.** Used RN `<TextInput>` directly with
  minimal style: `typeStyle('md')` for font, `chrome[mode].textPrimary`
  for color, no border (the parent `<Box background="subtle" radius="md">`
  provides the surface), `padding: 0` to defeat platform default insets.
  See `src/screens/modals/SendModal.tsx` for the recurring pattern. The
  shape renders consistently across iOS/Android/web at the typography
  + container level; selection UI still varies.
- **Fix proposed.** A DS `<TextField>` primitive shaped like:
  ```tsx
  <TextField
    label?: string
    placeholder?: string
    value: string
    onChange: (next: string) => void
    keyboard?: 'text' | 'decimal' | 'integer' | 'email' | 'url'
    autoCapitalize?: 'none' | 'words' | 'sentences'
    error?: string
    disabled?: boolean
    leading?: ReactNode      // e.g. currency symbol slot
    trailing?: ReactNode     // e.g. scan-QR IconButton slot
  >
  ```
  Owns surface, focus ring (or its RN-side equivalent · F-FOCUS-1
  applies), placeholder colour from chrome, IME-keyboard wiring,
  error-state semantic colour from the (currently unshipped) status
  palette. Companion primitives that fall out of this: `AmountField`
  (TextField + currency symbol + decimal validation), `<Select>`
  (Picker pattern). The IBAN-input flavour from nuri-expo's
  WalletIbanRecipientModal needs typed validation + format-as-you-type
  — likely a `TextField` extension, not a DS primitive.

- **Centered placeholder / cursor overlap** (sub-finding · Buy
  Bitcoin amount field). A "hero amount entry" pattern is centered
  (`textAlign: 'center'`) and uses a placeholder ("0.00"). When the
  field is focused and empty, the caret renders at insertion-point 0
  BUT gets positioned by the centred text-alignment — so caret and
  placeholder overlap visually (caret appears in the middle of the
  placeholder). On uncentered fields this isn't visible; on the
  hero variant it's awkward. A DS primitive should own one of:
  - Hide placeholder on focus while value is empty (placeholder
    disappears, caret sits cleanly centred), OR
  - Render a separate "0" / muted shadow value with explicit caret
    positioning, OR
  - Constrain `align`/centering to non-empty states only.
  A consumer can't fix this cleanly without re-implementing the
  placeholder layer (focus-state tracking + conditional placeholder
  swap). Belongs in `<AmountField>` / the proposed `<TextField hero>`
  variant, not in the consumer's screen code.

- **Cross-platform input filtering** (sub-finding · observed in Send
  flow): `keyboardType="decimal-pad"` is **RN-Native-only**. On RN-Web
  the underlying HTML `<input>` ignores it — letters can be typed into
  an EUR amount field, and the consumer has no signal anything is
  wrong. For real numeric input the DS `<TextField>` MUST wire all
  three of these together, not just the first:
  1. `keyboardType` (native iOS / Android — shows the numeric keypad)
  2. `inputMode` (RN-Web → HTML — shows numeric keypad on mobile web)
  3. **`onChangeText` filtering** inside the primitive (rejects
     non-numeric chars + multiple decimal points; neither
     `keyboardType` nor `inputMode` actually *prevent* input, they
     just hint at the keyboard)
  A consumer writing `keyboard="decimal"` should get "this field
  accepts numeric input only on every platform." Otherwise the spec
  is honoured on iOS / Android but silently broken on web — which is
  exactly the kind of platform-divergence the DS exists to prevent.
  This is why `keyboard` belongs on the DS primitive, NOT on the
  consumer-passed RN TextInput props.
- **Target.** Second-highest priority after F-MODAL-1. Together they
  unblock real product surfaces (every send/buy/auth flow needs both).
  Without input primitives the DS is restricted to read-only display
  + simple choice surfaces.

---

## F-PRESSABLE-TYPOGRAPHY-1 · No tap-on-text recipe

- **Gap.** Typography is purely presentational; it has no
  `onPress` / `accessibilityRole` / accessibility-label surface. To
  make text tappable (hide/show balance, tap-an-amount-to-copy,
  link-style text), the consumer wraps in a raw `Pressable`.
- **Where.** Wallet hero amount (tap toggles hide/show in this
  rebuild), tappable addresses, "tap to copy" patterns everywhere.
- **Workaround in consumer.** Wrap the Stack containing the hero
  Typography in a `<Pressable>` with explicit `accessibilityRole`
  and `accessibilityLabel`. Works but isn't DS-blessed.
- **Fix proposed.** A small `TextLink` / `PressableTypography`
  recipe that wraps Typography + a Pressable + a chrome-pressed
  background-or-color hover state. Mirrors the DS's existing
  `NavItem` recipe pattern (composition over primitives).
- **Target.** Recipe-tier addition; small surface.

---

## F-ICON-MISSING-1 · 17-glyph registry misses common wallet glyphs

- **Gap.** Real wallet UX needs: bank, paperplane (send), card,
  refresh, eye / eye-off (hide balance toggle), check-circle
  (success states), arrow-down-left / arrow-up-right (transaction
  directions stricter than `download-simple` / `arrow-up`). Current
  17-glyph set (vault, coin-vertical, clock, question, scan, gear,
  arrows-down-up, arrow-up, info, warning, apple-logo, caret-right,
  caret-left, download-simple, x-circle, plus, minus) covers core
  primitives but not domain icons.
- **Where.** This rebuild substitutes `download-simple` for "money
  in" and `arrow-up` for "money out" — semantically OK but visually
  not standard wallet iconography. Send button has no icon
  (paperplane unavailable), Details button has no icon (bank
  unavailable).
- **Workaround in consumer.** Use closest semantic match; accept
  the visual delta.
- **Fix proposed.** Per P11, add glyphs as concrete consumers
  emerge. The wallet rebuild is that consumer for at least:
  bank, paperplane, eye, eye-off, arrow-down-left, arrow-up-right.
- **Target.** Add to the registry in the next consumer-driven
  session (`add-component`-equivalent for icons).

---

## Positive controls (worth recording so the catalogue doesn't skew negative)

- **NuriThemeContext drop-in is 1:1.** Wrapping the app in
  `<NuriThemeContext.Provider value={{ mode: 'light', accent: 'lilac' }}>`
  is the entire theming setup. Every consumed component reads it via
  one `useContext`. No registry, no provider chain, no Unistyles
  config. F-SCOPE-1's closure (decision 62) holds at the consumer
  layer.
- **`build/*` import surface is small and stable.** The whole consumer
  contract is `chrome / accent / space / size / radius / type` from
  `build/tokens` + 8 per-component files + `build/icons` + a 38-leaf
  `TokenPath` union. Around 100 type-safe touchpoints total.
- **TabBar as a real navigator works.** App-level `useState` +
  `<TabBar value onChange>` swaps the rendered Screen for each of
  the three destinations (vault / coin / history). Decision 56's
  "router-agnostic destination switcher" framing is exactly what
  the consumer needs — the DS supplies the visual + selection
  state, the consumer wires the screen swap in one line. No
  navigation library required for a flat tab structure.
- **List + InteractiveListItem + IconAvatar render a wallet
  transaction list without further friction.** The
  `leading + content + trailing` slot model maps cleanly onto
  (avatar + counterparty/date + amount/status). Density "md" (72px
  row) reads as a comfortable transaction row.
- **The pinned-hero + scrolling-list split** (Topbar + Box +
  Scroll) compositionally separates "always visible chrome" from
  "scrolling body" without inventing a layout component — directly
  what nuri-expo's `BalanceScreenLayout` was carved out for.
- **Component vocabulary is rich enough for the wallet screen's
  layout.** No missing layout primitive surfaced. The decisions to
  ship Stack + Box + Screen + Scroll + Spacer as layout primitives
  (N+11) paid off — the wallet screen is 100% DS composition
  (modulo the gaps logged above, none of which are layout).

---

## Open questions for Dario / spec-agent

1. Does the playground my-vault.html intend the swap-row Separators
   to be visible flanking lines (web behaviour) or did the RN delta
   slip through unnoticed? (Implies F-SEPARATOR-ROW-1's severity.)
2. Is the v1.x "Icon in label" Roadmap item the canonical path for
   the Apple Pay composition, or is there a more compositional
   approach planned (e.g. `<Button.Leading>` slot)?
3. Would a `NuriThemeValue.fontFamily?: string` opt-in be acceptable,
   or does decision 27 explicitly preclude consumer-visible font
   knobs?
4. **Highest priority of the new findings:** Spinner. Every real
   product screen needs one (wallet pending, card auth, bitcoin
   sync, login). Is it deliberately deferred, or is this the
   evidence-gated trigger to ship?
5. Badge — same shape of question. The IconButton-with-badge is a
   universal tab/chat-app primitive. Add as part of IconButton, or
   as a standalone Badge consumed via composition?
6. Should `Scroll` always forward `refreshControl`? On web it's a
   no-op so cost is zero.
