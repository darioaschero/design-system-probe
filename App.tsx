/* ─────────────────────────────────────────────────────────────
 * App root
 *
 * Owns:
 *   · NuriThemeContext provider (decision 27/62 · single context)
 *   · SafeAreaProvider (insets for nested SafeAreaViews)
 *   · Tab navigation state (which Screen is rendered)
 *   · Modal state (which Sheet, if any, overlays the whole UI)
 *
 * Modal overlay rule: rendered as an absolutely-positioned View
 * SIBLING of the screen+TabBar column, placed LAST in tree order
 * so it draws above everything (RN draws in tree order). Pure
 * View overlay — no RN <Modal>, no platform-specific presentation,
 * no native animation. Identical pixel + behaviour on iOS, Android,
 * and web (operator · 2026-06-03).
 *
 * Per scope spec (pages/components/scope.html · decision 58), the
 * TabBar is navigator chrome and lives as a SIBLING of the Screen.
 * For this spike the SafeAreaView plays the navigator role.
 *
 * To validate dark mode, change `mode: 'light'` → `mode: 'dark'`
 * below and reload.
 * ───────────────────────────────────────────────────────────── */

import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  NuriThemeContext,
  TabBar,
  TabBarItem,
  chrome,
  type NuriThemeValue,
} from './src/ds';
import { WalletScreen } from './src/screens/WalletScreen';
import { CoinScreen } from './src/screens/CoinScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ReceiveModal } from './src/screens/modals/ReceiveModal';
import { SendModal } from './src/screens/modals/SendModal';

const THEME: NuriThemeValue = { mode: 'light', accent: 'lilac' };

type TabKey = 'vault' | 'coin' | 'history';
type ModalKey = 'none' | 'receive' | 'send';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('vault');
  const [activeModal, setActiveModal] = useState<ModalKey>('none');

  const closeModal = () => setActiveModal('none');

  const screen =
    activeTab === 'vault' ? (
      <WalletScreen
        onOpenReceive={() => setActiveModal('receive')}
        onOpenSend={() => setActiveModal('send')}
      />
    ) : activeTab === 'coin' ? (
      <CoinScreen />
    ) : (
      <HistoryScreen />
    );

  return (
    <NuriThemeContext.Provider value={THEME}>
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: chrome[THEME.mode].bgCanvas }}
          edges={['top', 'bottom']}
        >
          <View style={{ flex: 1 }}>
            {screen}
            <TabBar
              value={activeTab}
              onChange={(v) => setActiveTab(v as TabKey)}
              label="Main navigation"
            >
              <TabBarItem value="vault"   name="vault"         label="Wallet" />
              <TabBarItem value="coin"    name="coin-vertical" label="Coin" />
              <TabBarItem value="history" name="clock"         label="History" />
            </TabBar>
          </View>

          {/*
            DS-GAP F-MODAL-1 · no DS Modal / Sheet / overlay primitive
            Workaround: lift modal state to App (this useState block),
                        render the active modal as a position:absolute View
                        sibling drawn LAST in tree order so RN paints it
                        above the TabBar. Pure RN primitives — no RN
                        <Modal>, no native presentation, no animation.
                        Identical iOS / Android / web. Local <Sheet>
                        (src/components/Sheet.tsx) provides the chrome
                        (SafeAreaView + Screen + Topbar + close).
            Revert: replace this block + the <Sheet> component with
                    <SheetPortal>{... <Sheet open variant="full" .../>}</SheetPortal>
                    once the DS ships overlay primitives. The lifted
                    activeModal state stays at App if no portal context
                    ships; collapses into each Screen if portal ships.
            See SPEC-FEEDBACK.md#f-modal-1
          */}
          {activeModal !== 'none' ? (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
              {activeModal === 'receive' ? (
                <ReceiveModal onClose={closeModal} />
              ) : (
                <SendModal
                  onClose={closeModal}
                  onSelect={(_choice) => {
                    // Phase 2 routes each choice; for now just dismiss.
                    closeModal();
                  }}
                />
              )}
            </View>
          ) : null}

          <StatusBar style={THEME.mode === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </SafeAreaProvider>
    </NuriThemeContext.Provider>
  );
}
