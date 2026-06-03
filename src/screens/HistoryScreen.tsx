/* ─────────────────────────────────────────────────────────────
 * HistoryScreen · Phase 1 (design only · hardcoded values)
 *
 * The "History" / activity tab — the third TabBar destination (clock
 * glyph). Surfaces recent transactions. Function-equivalent of the
 * MoneriumTransactionsModal + transaction list views in nuri-expo,
 * rebuilt fresh from DS primitives.
 *
 * Per operator feedback (2026-06-03): transactions were originally
 * inlined on WalletScreen; that's not how nuri-expo ships, so they
 * moved here.
 *
 * Phase 2 swaps RECENT_TX for the real on-chain + Monerium-API
 * transaction feed (Issue #231 territory in nuri-expo).
 * ───────────────────────────────────────────────────────────── */

import React from 'react';
import {
  Screen,
  Scroll,
  Box,
  Stack,
  Spacer,
  Separator,
  Topbar,
  TopbarEnd,
  Typography,
  TypographyStack,
  IconButton,
  List,
  InteractiveListItem,
  IconAvatar,
} from '../ds';

type Tx = {
  id: string;
  direction: 'in' | 'out';
  counterparty: string;
  date: string;
  amount: string;
  status: string;
};

const RECENT_TX: Tx[] = [
  { id: '1', direction: 'out', counterparty: 'Coffee Roasters', date: '26 May at 11:34', amount: '−€ 4.20',     status: 'Complete' },
  { id: '2', direction: 'in',  counterparty: 'Salary',          date: '25 May at 09:01', amount: '+€ 2,800.00', status: 'Complete' },
  { id: '3', direction: 'out', counterparty: 'Apartment Rent',  date: '21 May at 08:00', amount: '−€ 1,250.00', status: 'Complete' },
  { id: '4', direction: 'out', counterparty: 'Spotify',         date: '18 May at 14:22', amount: '−€ 9.99',     status: 'Complete' },
  { id: '5', direction: 'in',  counterparty: 'Alice (refund)',  date: '15 May at 17:43', amount: '+€ 32.50',    status: 'Complete' },
  { id: '6', direction: 'out', counterparty: 'Grocery Store',   date: '12 May at 18:12', amount: '−€ 67.40',    status: 'Complete' },
  { id: '7', direction: 'in',  counterparty: 'Freelance · Acme',date: '10 May at 10:00', amount: '+€ 1,500.00', status: 'Complete' },
];

export const HistoryScreen: React.FC = () => (
  <Screen>
    <Topbar>
      History
      <TopbarEnd>
        <IconButton name="question" variant="ghost" label="Support" />
      </TopbarEnd>
    </Topbar>

    <Scroll>
      <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
        <Stack direction="column" gap="md">
          <List density="md">
            {RECENT_TX.map((tx) => (
              <React.Fragment key={tx.id}>
                <Separator />
                <InteractiveListItem
                  onPress={() => {/* Phase 2 — opens transaction detail */}}
                  leading={
                    /*
                      DS-GAP F-ICON-MISSING-1 · 17-glyph registry lacks
                      directional transaction glyphs
                      Workaround: `download-simple` for incoming (closest
                                  "money in" semantic), `arrow-up` for
                                  outgoing.
                      Revert: switch to `arrow-down-left` (or `arrow-into`)
                              for in, `arrow-up-right` (or `paperplane`)
                              for out once the registry expands.
                      See SPEC-FEEDBACK.md#f-icon-missing-1
                    */
                    <IconAvatar
                      name={tx.direction === 'in' ? 'download-simple' : 'arrow-up'}
                      variant="soft"
                    />
                  }
                  trailing={
                    <TypographyStack>
                      <Typography size="md" emphasis align="end">{tx.amount}</Typography>
                      <Typography size="sm" muted align="end">{tx.status}</Typography>
                    </TypographyStack>
                  }
                >
                  <TypographyStack>
                    <Typography size="md" emphasis>{tx.counterparty}</Typography>
                    <Typography size="sm" muted>{tx.date}</Typography>
                  </TypographyStack>
                </InteractiveListItem>
              </React.Fragment>
            ))}
          </List>
          <Spacer size="xl" />
        </Stack>
      </Box>
    </Scroll>
  </Screen>
);
