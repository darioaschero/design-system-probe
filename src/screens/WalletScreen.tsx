/* ─────────────────────────────────────────────────────────────
 * WalletScreen · Phase 1 (design only · hardcoded values)
 *
 * Function-equivalent of nuri-expo's screens/wallet/WalletScreen.tsx,
 * rebuilt fresh from DS primitives. LAYOUT IS NEW — composition is
 * informed by DS playground patterns, NOT by nuri-expo's
 * BalanceScreenLayout / ScreenHeader / TappableBalance.
 *
 * Functions surfaced:
 *   · Hero balance · tap to hide/show
 *   · Pending tx pill (preview by editing INITIAL_PENDING below)
 *   · Primary actions · Receive + Send (Send fans out to send / buy BTC downstream)
 *   · Support entry · Topbar end IconButton
 *
 * Per operator feedback (2026-06-03):
 *   · Recent transactions moved to HistoryScreen (the third TabBar tab).
 *   · Currency switcher removed — nuri-expo rotates on balance tap,
 *     not via visible buttons; rotation itself was dropped for the
 *     spike (the screen displays a single home currency).
 * ───────────────────────────────────────────────────────────── */

import React, { useState } from 'react';
import { Pressable } from 'react-native';
import {
  Screen,
  Box,
  Stack,
  Spacer,
  Topbar,
  TopbarEnd,
  Typography,
  TypographyStack,
  Button,
  IconButton,
  Icon,
} from '../ds';

type Pending = { label: string; amount: string } | null;

// Hardcoded Phase 1 data. Phase 2 swaps for useWalletBalance from
// nuri-expo's services. Home currency is hardcoded EUR — the
// real selectedDisplayCurrency comes from safeCurrencyService.
const HOME_BALANCE = 1234.56;
const HOME_SYMBOL = '€';
const HOME_CODE = 'EUR';

// Set to e.g. { label: 'Sending to Alex', amount: '€ 24.00' } to preview the pending pill.
const INITIAL_PENDING: Pending = null;

function formatBalance(balance: number, symbol: string): string {
  return `${symbol} ${balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Props = {
  onOpenReceive: () => void;
  onOpenSend: () => void;
};

export const WalletScreen: React.FC<Props> = ({ onOpenReceive, onOpenSend }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pending] = useState<Pending>(INITIAL_PENDING);

  const heroAmount = isHidden ? '••••••' : formatBalance(HOME_BALANCE, HOME_SYMBOL);

  return (
    <Screen>
      <Topbar>
        Wallet
        <TopbarEnd>
          {/*
            DS-GAP F-BADGE-1 · no notification badge primitive
            Workaround: bare IconButton, no unread-count indicator.
            Revert: add `badge={unread}` prop once IconButton ships badge
                    support (or wrap in a <Badge count={unread}> when
                    a standalone primitive lands).
            See SPEC-FEEDBACK.md#f-badge-1
          */}
          <IconButton name="question" variant="ghost" label="Support" />
        </TopbarEnd>
      </Topbar>

      <Box paddingX="lg" fill>
        <Stack direction="column" fill>

          {/* Spacer above the centered hero+buttons group. */}
          <Spacer grow={1} />

          {/*
            Combined hero + buttons group · centered vertically between
            Topbar and TabBar (sandwiched between two Spacer grow={1}).
            Inner gap="md" handles spacing within the group.
          */}
          <Stack direction="column" gap="md">

            {/*
              Hero balance · tap toggles hide/show.
              DS-GAP F-PRESSABLE-TYPOGRAPHY-1 · Typography has no onPress
              Workaround: raw <Pressable> wrapper with explicit accessibility
                          role + label.
              Revert: replace with <PressableTypography> recipe (or pass an
                      onPress prop directly to Typography) once it ships.
              See SPEC-FEEDBACK.md#f-pressable-typography-1
            */}
            <Pressable
              onPress={() => setIsHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={isHidden ? 'Show balance' : 'Hide balance'}
            >
              <Stack direction="column" align="center">
                <TypographyStack>
                  <Typography size="3xl" emphasis align="center">{heroAmount}</Typography>
                  <Typography size="sm" muted align="center">{HOME_CODE}</Typography>
                </TypographyStack>
              </Stack>
            </Pressable>

            {/*
              Pending tx pill (conditional).
              DS-GAP F-PENDING-INDICATOR-1 · no DS Spinner / Banner / status pill
              Workaround: Box background="accent-subtle" radius="md" + Icon
                          name="clock" + plain Typography. No animation.
              Revert: replace the Box block with <Banner variant="pending"
                      icon="clock"> or <StatusPill variant="pending"> once the
                      DS Spinner + Banner primitives land.
              See SPEC-FEEDBACK.md#f-pending-indicator-1
            */}
            {pending ? (
              <Box paddingX="md" paddingY="sm" radius="md" background="accent-subtle">
                <Stack direction="row" gap="sm" align="center">
                  <Icon name="clock" size="sm" />
                  <Typography size="sm" emphasis>{pending.label}</Typography>
                  <Spacer />
                  <Typography size="sm">{pending.amount}</Typography>
                </Stack>
              </Box>
            ) : null}

            {/*
              Primary actions · Button.base has flex: 1 so the row splits evenly.
              Send opens a downstream choice (send to address / buy BTC) — modeled
              as one entry rather than two co-equal CTAs (operator call · 2026-06-03).
              Modal visibility is owned by App.tsx so the overlay can render above
              the TabBar.
            */}
            <Stack direction="row" gap="sm">
              <Button variant="soft" size="lg" onPress={onOpenReceive}>Receive</Button>
              <Button variant="solid" size="lg" onPress={onOpenSend}>Send</Button>
            </Stack>

          </Stack>
          {/* /Inner group · trailing Spacer balances the leading one. */}

          <Spacer grow={1} />

        </Stack>
      </Box>
    </Screen>
  );
};
