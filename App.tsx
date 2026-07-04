/* ──────────────────────────────────────────────────────────────
 * PROBE · one screen that exercises the vendored DS surface on
 * nuri-expo's exact stack: theme provider · View/Text/Icon layout
 * props · generated Button variants · the BottomSheet family
 * (all three detents + dismissible off).
 * ────────────────────────────────────────────────────────────── */

import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  BottomSheetPanel,
  BottomSheetScroll,
  Button,
  NuriIcon,
  NuriThemeProvider,
  Text,
  View,
} from './ds/nuri';
import type { BottomSheetDetent } from './ds/nuri';

const DETENTS: readonly BottomSheetDetent[] = ['content', 'large', 'full'];

const Probe: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [detentIndex, setDetentIndex] = React.useState(0);
  const [dismissible, setDismissible] = React.useState(true);
  const detent = DETENTS[detentIndex];

  return (
    <View direction="column" align="stretch" justify="start" fill="grow" chrome="canvas">
      <View direction="column" align="stretch" gap="lg" paddingX="lg" paddingY="md" fill="grow">
        <View direction="row" align="center" gap="sm">
          <NuriIcon name="nuri" />
          <Text size="xl" emphasis>
            DS integration probe
          </Text>
        </View>

        <View aspectRatio="card" radius="lg" />
        <Text size="3xl" emphasis align="center">
          € 25.87
        </Text>

        <View direction="row" align="center" gap="sm">
          <View fill="even">
            <Button size="lg" variant="soft">
              Receive
            </Button>
          </View>
          <View fill="even">
            <Button size="lg" variant="solid" accent="orange">
              Send
            </Button>
          </View>
        </View>

        <Button size="lg" variant="solid" onPress={() => setSheetOpen(true)}>
          Open sheet
        </Button>
      </View>

      <BottomSheet
        open={sheetOpen}
        detent={detent}
        dismissible={dismissible}
        onOpenChange={setSheetOpen}
      >
        <BottomSheetPanel>
          <BottomSheetScroll>
            <View direction="column" align="stretch" gap="md" paddingX="lg" paddingY="md">
              <Text size="xl" emphasis>
                Sheet · {detent}
              </Text>
              <Button
                size="lg"
                variant="soft"
                onPress={() => setDetentIndex((detentIndex + 1) % DETENTS.length)}
              >
                Cycle detent
              </Button>
              <Button size="lg" variant="soft" onPress={() => setDismissible(!dismissible)}>
                {dismissible ? 'Lock (dismissible off)' : 'Unlock (dismissible on)'}
              </Button>
              <Button size="lg" variant="solid" accent="orange" onPress={() => setSheetOpen(false)}>
                Close
              </Button>
              <Text>
                Scrim tap and the close button must dismiss; when locked, only the unlock + close
                buttons work. Cycling detents while open probes S3 on this RN version.
              </Text>
            </View>
          </BottomSheetScroll>
        </BottomSheetPanel>
      </BottomSheet>

      {/* safe-area shim: the probe owns insets, the DS stays inset-agnostic */}
      {insets.bottom > 0 ? <View paddingY="md" /> : null}
      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NuriThemeProvider mode="light" accent="neutral">
        <Probe />
      </NuriThemeProvider>
    </SafeAreaProvider>
  );
}
