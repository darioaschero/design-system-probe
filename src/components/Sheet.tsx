/* ─────────────────────────────────────────────────────────────
 * Sheet · LOCAL gap workaround · pure RN, zero platform branches
 *
 * ⚠ This is NOT a DS-blessed primitive. The Nuri DS at commit
 *   0b3f97a1 ships no Modal / Sheet / Dialog component. Logged
 *   as F-MODAL-1 — highest-priority finding in SPEC-FEEDBACK.
 *
 * Design constraint (operator · 2026-06-03): as few native
 * mechanisms as possible. The previous version used RN's built-in
 * <Modal>, which slides in differently on iOS / Android / web
 * (presentationStyle, easing, status bar). Replaced here with a
 * pure absolute-overlay View — identical pixel + behaviour
 * everywhere. The trade-off:
 *
 *   · No native slide animation (snap-in / snap-out)
 *   · No native back-button handling (Android hardware back / web ESC
 *     are not wired; user closes only via the x-circle in the Topbar)
 *   · No native presentation-style differences
 *
 * Structure: this file ships ONLY the modal CHROME (chrome[mode]
 * background + SafeAreaView + DS Screen + Topbar + close). The
 * OVERLAY (absolute positioning, root mount) lives in App.tsx so
 * it draws above the TabBar.
 * ───────────────────────────────────────────────────────────── */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NuriThemeContext,
  Screen,
  Topbar,
  TopbarStart,
  TopbarEnd,
  IconButton,
  chrome,
} from '../ds';

export type SheetProps = {
  onClose: () => void;
  title: string;
  /**
   * Optional content rendered in the Topbar's start slot. Use this for an
   * in-modal back affordance when a sheet hosts a multi-step flow
   * (e.g. Receive: choice → bank/crypto detail · back returns to choice).
   * The close IconButton in the end slot is always rendered.
   */
  leading?: React.ReactNode;
  children: React.ReactNode;
};

export const Sheet: React.FC<SheetProps> = ({ onClose, title, leading, children }) => {
  const { mode } = React.useContext(NuriThemeContext);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: chrome[mode].bgCanvas }}
      edges={['top', 'bottom']}
    >
      <Screen>
        {/*
          DS-GAP F-TOPBAR-DEFAULT-START-COLLAPSE-1 · default-mode Topbar's
                                                    start region collapses
                                                    to width 0 (topbar.tsx:111
                                                    sets `flex: 0`)
          Workaround: use `<Topbar center>` — sets both side regions to
                      flex:1, no collapse. Trade-off: title centers (iOS
                      modal convention) instead of left-aligning.
          Revert: drop the `center` prop once the DS fix lands — IF you
                  prefer left-aligned modal titles. Code keeps working
                  in `center` mode regardless.
          See SPEC-FEEDBACK.md#f-topbar-default-start-collapse-1
        */}
        <Topbar center>
          {leading ? <TopbarStart>{leading}</TopbarStart> : null}
          {title}
          <TopbarEnd>
            <IconButton
              name="x-circle"
              variant="ghost"
              fill
              label="Close"
              onPress={onClose}
            />
          </TopbarEnd>
        </Topbar>
        {children}
      </Screen>
    </SafeAreaView>
  );
};
