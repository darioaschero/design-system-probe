/* ─────────────────────────────────────────────────────────────
 * SendModal · choice → detail flow (4 views)
 *
 * Opened from WalletScreen's "Send" button. Mirrors ReceiveModal's
 * structure: a choice view + N detail forms, internal state machine,
 * caret-left back from detail returns to choice, close exits.
 *
 * Views:
 *   · 'choice'   · 3 NavItems (Bank · Crypto · Buy Bitcoin)
 *   · 'bank'     · IBAN transfer form (recipient · IBAN · amount · ref)
 *   · 'crypto'   · on-chain send form (address · amount + scan QR)
 *   · 'buy_btc'  · fiat→BTC swap form (EUR amount → estimated BTC)
 *
 * Function-equivalent of nuri-expo's WalletSendChoiceModal +
 * WalletSendStablecoinModal + WalletIbanRecipientModal +
 * MercuryoBuyBitcoinModal, condensed into ONE composed flow.
 *
 * Phase 2 wires onSubmit to the real signing / SIWE / Mercuryo paths.
 *
 * Active DS-gap workarounds in this file (grep "DS-GAP"):
 *   · F-TEXTINPUT-1 · RN TextInput used directly (no DS primitive)
 *   · F-ICON-MISSING-1 · paperplane / send glyph absent from registry
 *   · F-BUTTON-CHILDREN-1 · text-only Send / Buy labels (no leading icon)
 * ───────────────────────────────────────────────────────────── */

import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import {
  Scroll,
  Box,
  Stack,
  Spacer,
  Separator,
  Typography,
  TypographyStack,
  Button,
  IconButton,
  Icon,
  List,
  NavItem,
  typeStyle,
  chrome,
  NuriThemeContext,
} from '../../ds';
import { Sheet } from '../../components/Sheet';

export type SendChoice = 'send_iban' | 'send_crypto' | 'buy_btc';

type View_ = 'choice' | 'bank' | 'crypto' | 'buy_btc';

// Spike-local fakes. Phase 2 wires from safeCurrencyService /
// fxRateService / walletService.
const AVAILABLE_EUR = 1234.56;
const BTC_RATE_EUR  = 83_000; // 1 BTC ≈ 83 000 EUR (fake)

type Props = {
  onClose: () => void;
  onSelect?: (choice: SendChoice) => void;
};

export const SendModal: React.FC<Props> = ({ onClose, onSelect }) => {
  const [view, setView] = useState<View_>('choice');
  const back = () => setView('choice');

  const backButton = (
    <IconButton name="caret-left" variant="ghost" label="Back" onPress={back} />
  );

  if (view === 'bank') {
    return (
      <BankForm
        onClose={onClose}
        backButton={backButton}
        onSubmit={() => {
          onSelect?.('send_iban');
          onClose();
        }}
      />
    );
  }

  if (view === 'crypto') {
    return (
      <CryptoForm
        onClose={onClose}
        backButton={backButton}
        onSubmit={() => {
          onSelect?.('send_crypto');
          onClose();
        }}
      />
    );
  }

  if (view === 'buy_btc') {
    return (
      <BuyBtcForm
        onClose={onClose}
        backButton={backButton}
        onSubmit={() => {
          onSelect?.('buy_btc');
          onClose();
        }}
      />
    );
  }

  return (
    <Sheet onClose={onClose} title="Send">
      <Scroll>
        <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
          <Stack direction="column" gap="sm">
            <Typography size="md" muted>Choose how</Typography>
            <List density="md">
              <Separator />
              <NavItem onPress={() => setView('bank')}>Send to bank account (EUR)</NavItem>
              <Separator />
              <NavItem onPress={() => setView('crypto')}>Send to crypto address</NavItem>
              <Separator />
              <NavItem onPress={() => setView('buy_btc')}>Buy Bitcoin</NavItem>
            </List>
          </Stack>
        </Box>
      </Scroll>
    </Sheet>
  );
};

/* ─────────────────────────────────────────────────────────────
 * Sub-views · each owns its form state.
 * ───────────────────────────────────────────────────────────── */

type FormProps = {
  onClose: () => void;
  backButton: React.ReactNode;
  onSubmit: () => void;
};

const BankForm: React.FC<FormProps> = ({ onClose, backButton, onSubmit }) => {
  const [recipient, setRecipient] = useState('');
  const [iban, setIban] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const canSubmit = recipient.trim().length > 0 && iban.trim().length > 0 && amount.trim().length > 0;

  return (
    <Sheet onClose={onClose} title="Send to bank" leading={backButton}>
      <Scroll>
        <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
          <Stack direction="column" gap="lg">
            <FieldGroup label="Recipient name">
              <FieldInput
                value={recipient}
                onChangeText={setRecipient}
                placeholder="e.g. Maria Schmidt"
                autoCapitalize="words"
              />
            </FieldGroup>
            <FieldGroup label="IBAN">
              <FieldInput
                value={iban}
                onChangeText={setIban}
                placeholder="DE…"
                autoCapitalize="characters"
              />
            </FieldGroup>
            <FieldGroup label="Amount (EUR)">
              <FieldInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Typography size="sm" muted>Available: € {AVAILABLE_EUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
            </FieldGroup>
            <FieldGroup label="Reference (optional)">
              <FieldInput
                value={reference}
                onChangeText={setReference}
                placeholder="What's it for?"
              />
            </FieldGroup>

            <Spacer grow={1} />
            <Stack direction="row">
              {/* DS-GAP F-BUTTON-CHILDREN-1 · text-only label
                  Revert: pass <Icon name="paperplane" leading /> once Button.leading lands.
                  See SPEC-FEEDBACK.md#f-button-children-1 */}
              <Button variant="solid" size="lg" disabled={!canSubmit} onPress={onSubmit}>
                {`Send € ${amount || '0.00'}`}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Scroll>
    </Sheet>
  );
};

const CryptoForm: React.FC<FormProps> = ({ onClose, backButton, onSubmit }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  const canSubmit = address.trim().length > 0 && amount.trim().length > 0;

  return (
    <Sheet onClose={onClose} title="Send to crypto" leading={backButton}>
      <Scroll>
        <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
          <Stack direction="column" gap="lg">
            <FieldGroup label="Recipient address (Gnosis Chain)">
              {/*
                Address + scan QR composite. The TextInput grows; the IconButton
                hugs its 48×48. Stack row + flex on Box does the split.
              */}
              <Stack direction="row" gap="sm" align="center">
                <Box paddingX="md" paddingY="sm" background="subtle" radius="md" style={{ flex: 1 }}>
                  <FieldInputRaw
                    value={address}
                    onChangeText={setAddress}
                    placeholder="0x…"
                    autoCapitalize="none"
                  />
                </Box>
                <IconButton name="scan" variant="soft" label="Scan QR" />
              </Stack>
            </FieldGroup>
            <FieldGroup label="Amount (EUR)">
              <FieldInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Typography size="sm" muted>Available: € {AVAILABLE_EUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
            </FieldGroup>

            {/*
              Gnosis Chain warning · reuses the F-PENDING-INDICATOR-1 workaround
              shape (Box + accent-subtle + warning Icon). Revert to a DS Banner
              once that primitive lands.
              See SPEC-FEEDBACK.md#f-pending-indicator-1
            */}
            <Box paddingX="md" paddingY="sm" radius="md" background="accent-subtle">
              <Stack direction="row" gap="sm" align="center">
                <Icon name="warning" size="sm" />
                <Typography size="sm">
                  Gnosis Chain only. Other networks will be lost.
                </Typography>
              </Stack>
            </Box>

            <Spacer grow={1} />
            <Stack direction="row">
              <Button variant="solid" size="lg" disabled={!canSubmit} onPress={onSubmit}>
                {`Send € ${amount || '0.00'}`}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Scroll>
    </Sheet>
  );
};

const BuyBtcForm: React.FC<FormProps> = ({ onClose, backButton, onSubmit }) => {
  const { mode } = React.useContext(NuriThemeContext);
  const [amount, setAmount] = useState('');

  const eurAmount = parseFloat(amount || '0');
  const estBtc = Number.isFinite(eurAmount) && eurAmount > 0 ? eurAmount / BTC_RATE_EUR : 0;
  const canSubmit = eurAmount > 0 && eurAmount <= AVAILABLE_EUR;

  return (
    <Sheet onClose={onClose} title="Buy Bitcoin" leading={backButton}>
      <Scroll>
        <Box paddingX="lg" paddingTop="md" paddingBottom="lg">
          <Stack direction="column" gap="lg">

            {/* Hero amount entry · large TextInput centered */}
            <Stack direction="column" gap="sm" align="center">
              <Typography size="sm" muted>You pay</Typography>
              {/*
                DS-GAP F-TEXTINPUT-1 · raw RN TextInput with typeStyle.
                Revert to <TextField hero> once DS ships text input.
                See SPEC-FEEDBACK.md#f-textinput-1
              */}
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={chrome[mode].textMuted}
                keyboardType="decimal-pad"
                style={{
                  ...typeStyle('xlEm'),
                  color: chrome[mode].textPrimary,
                  textAlign: 'center',
                  padding: 0,
                  minWidth: 160,
                }}
              />
              <Typography size="sm" muted>EUR · Available € {AVAILABLE_EUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
            </Stack>

            {/* Estimate */}
            <Box paddingX="md" paddingY="md" background="subtle" radius="md">
              <TypographyStack>
                <Typography size="sm" muted>You receive (estimate)</Typography>
                <Typography size="lg" emphasis>≈ ₿ {estBtc === 0 ? '0.00' : estBtc.toFixed(8)}</Typography>
                <Typography size="sm" muted>
                  1 BTC ≈ € {BTC_RATE_EUR.toLocaleString('en-US')}
                </Typography>
              </TypographyStack>
            </Box>

            <Spacer grow={1} />
            <Stack direction="row">
              <Button variant="solid" size="lg" disabled={!canSubmit} onPress={onSubmit}>
                Buy Bitcoin
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Scroll>
    </Sheet>
  );
};

/* ─────────────────────────────────────────────────────────────
 * Form atoms · local to this file.
 *
 * Both wrap RN TextInput because the DS ships no text input
 * primitive (DS-GAP F-TEXTINPUT-1). Revert these atoms to the DS
 * <TextField> once that lands.
 * See SPEC-FEEDBACK.md#f-textinput-1
 * ───────────────────────────────────────────────────────────── */

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  // DS-GAP F-STACK-2XS-GAP-1 · Stack only accepts xs..xl (5-leaf subset of
  // the 8-leaf semantic space scale). For a tighter label-above-input gap
  // we'd want '2xs' = 2px, but Stack's `gap` prop rejects it. Using 'xs' (4px).
  // Revert: pass gap="2xs" if Stack widens its prop to match the full space scale.
  // See SPEC-FEEDBACK.md — to be logged.
  <Stack direction="column" gap="xs">
    <Typography size="sm" muted>{label}</Typography>
    {children}
  </Stack>
);

type FieldInputProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

// Default surface · subtle bg + md radius via Box.
const FieldInput: React.FC<FieldInputProps> = (props) => (
  <Box paddingX="md" paddingY="sm" background="subtle" radius="md">
    <FieldInputRaw {...props} />
  </Box>
);

// Raw input (no surface) · for composing inside a custom row (e.g. address + scan).
const FieldInputRaw: React.FC<FieldInputProps> = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) => {
  const { mode } = React.useContext(NuriThemeContext);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={chrome[mode].textMuted}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      style={{
        ...typeStyle('md'),
        color: chrome[mode].textPrimary,
        padding: 0,
      }}
    />
  );
};

// Imported but unused stub — kept here so the TextInput keyboardType stays narrow.
const _unusedView = View;
void _unusedView;
