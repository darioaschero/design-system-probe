/* ─────────────────────────────────────────────────────────────
 * Module augmentation · react-native-svg
 *
 * The DS spec's local shim
 * (vendor/.../button-matrix/react-native-svg.d.ts) declares the
 * `SvgXmlProps` named export the migration-test `_shared.tsx`
 * imports. The real `react-native-svg` package does not export
 * that name today (it ships `XmlProps` / `SvgProps`).
 *
 * This shim adds ONLY the missing named type via TypeScript
 * declaration merging — it does NOT redeclare `SvgXml`, so the
 * real package's runtime stays authoritative.
 *
 * Logged upstream as F-TYPESCRIPT-SVGXMLPROPS in SPEC-FEEDBACK.md.
 * Remove this file once the DS aligns the type name with the real
 * package (or the package re-exports `SvgXmlProps`).
 * ───────────────────────────────────────────────────────────── */

// The empty import below makes this file a module, so `declare module`
// below MERGES with the real package's types instead of shadowing them.
import 'react-native-svg';

declare module 'react-native-svg' {
  export interface SvgXmlProps {
    xml: string;
    width?: number;
    height?: number;
    color?: string;
  }
}
