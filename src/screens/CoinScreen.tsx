/* ─────────────────────────────────────────────────────────────
 * CoinScreen · Phase 1 placeholder
 *
 * The middle TabBar destination (coin-vertical glyph). In nuri-expo
 * the equivalent tab is the Bitcoin screen; for this spike it's a
 * placeholder so the TabBar navigator wiring has all three
 * destinations populated.
 * ───────────────────────────────────────────────────────────── */

import React from 'react';
import {
  Screen,
  Box,
  Stack,
  Topbar,
  TopbarEnd,
  Typography,
  IconButton,
} from '../ds';

export const CoinScreen: React.FC = () => (
  <Screen>
    <Topbar>
      Coin
      <TopbarEnd>
        <IconButton name="question" variant="ghost" label="Support" />
      </TopbarEnd>
    </Topbar>
    <Box paddingX="lg" paddingTop="lg" fill>
      <Stack direction="column" align="center" justify="center" fill>
        <Typography size="md" muted align="center">
          Bitcoin tab · placeholder for this spike.
        </Typography>
      </Stack>
    </Box>
  </Screen>
);
