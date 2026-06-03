/* ─────────────────────────────────────────────────────────────
 * ReceiveModal · choice → detail flow
 *
 * Opened from WalletScreen's "Receive" button. Two-step flow:
 *   1. Choice view · NavItem list (Bank transfer · Crypto)
 *   2. Detail view · the picked rail's actual receive info
 *
 * In-modal navigation: caret-left back affordance in the Topbar's
 * start slot on detail views returns to choice. Close (x-circle in
 * end slot) always exits the modal entirely. State resets when the
 * modal closes (React unmounts it via App.tsx conditional render).
 *
 * Function-equivalent of the existing nuri-expo WalletDetailsModal
 * (which surfaced both rails at once); operator restructured the
 * flow to choice → detail (2026-06-03) to match the Send pattern
 * and to give the crypto rail room for chain-specific warnings.
 *
 * Phase 2 swaps FAKE_DETAILS for useWalletAuth + lib/banking +
 * the Gnosis Safe address from useWalletBalance.
 * ───────────────────────────────────────────────────────────── */

import React, { useState } from 'react';
import {
  Scroll,
  Box,
  Stack,
  Separator,
  Typography,
  TypographyStack,
  Icon,
  IconButton,
  List,
  ListItem,
  NavItem,
} from '../../ds';
import { Sheet } from '../../components/Sheet';

type View = 'choice' | 'bank' | 'crypto';

const FAKE_DETAILS = {
  accountHolder: 'Maria Schmidt',
  bank: 'Commerzbank · Frankfurt am Main',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
  gnosisAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd9',
};

type Props = { onClose: () => void };

export const ReceiveModal: React.FC<Props> = ({ onClose }) => {
  const [view, setView] = useState<View>('choice');
  const back = () => setView('choice');

  if (view === 'bank') {
    return (
      <Sheet
        onClose={onClose}
        title="Bank transfer"
        leading={
          <IconButton name="caret-left" variant="ghost" label="Back" onPress={back} />
        }
      >
        <Scroll>
          <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
            <Stack direction="column" gap="sm">
              <Typography size="sm" muted>EUR · SEPA</Typography>
              <List density="md">
                <Separator />
                <ListItem>
                  <TypographyStack>
                    <Typography size="sm" muted>Account holder</Typography>
                    <Typography size="md" emphasis>{FAKE_DETAILS.accountHolder}</Typography>
                  </TypographyStack>
                </ListItem>
                <Separator />
                <ListItem>
                  <TypographyStack>
                    <Typography size="sm" muted>Bank</Typography>
                    <Typography size="md" emphasis>{FAKE_DETAILS.bank}</Typography>
                  </TypographyStack>
                </ListItem>
                <Separator />
                <ListItem>
                  <TypographyStack>
                    <Typography size="sm" muted>IBAN</Typography>
                    <Typography size="md" emphasis>{FAKE_DETAILS.iban}</Typography>
                  </TypographyStack>
                </ListItem>
                <Separator />
                <ListItem>
                  <TypographyStack>
                    <Typography size="sm" muted>BIC</Typography>
                    <Typography size="md" emphasis>{FAKE_DETAILS.bic}</Typography>
                  </TypographyStack>
                </ListItem>
              </List>
            </Stack>
          </Box>
        </Scroll>
      </Sheet>
    );
  }

  if (view === 'crypto') {
    return (
      <Sheet
        onClose={onClose}
        title="Crypto"
        leading={
          <IconButton name="caret-left" variant="ghost" label="Back" onPress={back} />
        }
      >
        <Scroll>
          <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
            <Stack direction="column" gap="md">
              <Typography size="sm" muted>Gnosis Chain · EURe / USDC</Typography>
              <List density="md">
                <Separator />
                <ListItem>
                  <TypographyStack>
                    <Typography size="sm" muted>Address</Typography>
                    <Typography size="md" emphasis>{FAKE_DETAILS.gnosisAddress}</Typography>
                  </TypographyStack>
                </ListItem>
              </List>
              {/*
                Warning pill.
                DS-GAP F-PENDING-INDICATOR-1 · no DS Banner / Alert primitive
                Workaround: Box background="accent-subtle" + warning Icon +
                            Typography (same shape as the wallet pending pill).
                Revert: replace with <Banner variant="warning"
                        icon="warning"> once the DS Banner ships
                        (likely alongside the F-MODAL-1 overlay family).
                See SPEC-FEEDBACK.md#f-pending-indicator-1
              */}
              <Box paddingX="md" paddingY="sm" radius="md" background="accent-subtle">
                <Stack direction="row" gap="sm" align="center">
                  <Icon name="warning" size="sm" />
                  <Typography size="sm">
                    Only send from Gnosis Chain. Other networks will be lost.
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Scroll>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} title="Receive">
      <Scroll>
        <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
          <Stack direction="column" gap="sm">
            <Typography size="md" muted>Choose how</Typography>
            <List density="md">
              <Separator />
              <NavItem onPress={() => setView('bank')}>Bank transfer (EUR)</NavItem>
              <Separator />
              <NavItem onPress={() => setView('crypto')}>Crypto (Gnosis Chain)</NavItem>
            </List>
          </Stack>
        </Box>
      </Scroll>
    </Sheet>
  );
};
