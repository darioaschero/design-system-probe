/* ─────────────────────────────────────────────────────────────
 * nuri-design-system · consumer barrel
 *
 * Re-exports the vendored DS surface (build/* + per-component RN
 * mirrors from docs/migration-tests/button-matrix/) under one
 * import path. Production-shape: in a real consumer this barrel
 * would be `@nuri/design-system` from npm; here it points at the
 * vendored snapshot, unchanged, so internal DS relative paths
 * (`../../../build/...`) keep resolving without local edits.
 *
 * Re-vendor by replacing `vendor/nuri-design-system/` from upstream.
 * ───────────────────────────────────────────────────────────── */

// Theming primitives + shared helpers
export {
  NuriThemeContext,
  NuriScope,
  resolveToken,
  typeStyle,
  useRuntimeTokens,
  type NuriThemeValue,
  type RuntimeTokens,
  type SpaceLeaf,
  type TypeKey,
} from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/_shared';

// Tokens (runtime sets · re-exported from _shared)
export {
  accentTokens,
  chrome,
  space,
  size,
  radius,
  typeScale,
  type Accent,
  type Theme,
  type TypeSize,
  type TypeWeight,
  type TypeStep,
  type TokenPath,
  type IconName,
  type IconWeight,
} from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/_shared';

// Layout
export { Screen } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/screen';
export { Scroll } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/scroll';
export { Stack } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/stack';
export { Box } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/box';
export { Spacer } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/spacer';
export { Separator } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/separator';

// Display
export { Typography } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/typography';
export { TypographyStack } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/typography-stack';
export { Icon } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/icon';
export { IconAvatar } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/icon-avatar';

// Actions
export { Button } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/button';
export { IconButton } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/icon-button';

// Inputs
export { Switch } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/switch';

// Navigation
export { Topbar, TopbarStart, TopbarEnd } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/topbar';
export { Tabs, Tab } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/tabs';
export { TabBar, TabBarItem } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/tab-bar';

// List family
export { List, ListItem, InteractiveListItem } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/list';
export { NavItem } from '../../vendor/nuri-design-system/docs/migration-tests/button-matrix/nav-item';
