import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import CompanionAvatar from '../components/CompanionAvatar';
import { loadSettings } from '../services/settings';
import { CompanionId, DEFAULT_COMPANION } from '../companions/config';
import OverlayFeatureBubble from '../components/OverlayFeatureBubble';
import { useAssistantSessionLifecycle } from '../hooks/useAssistantSessionLifecycle';
import { OverlayVoiceActionBanner } from '../components/OverlayVoiceActionBanner';
import OverlayGestureContainer from '../components/OverlayGestureContainer';

// AO-4 v2 (v49): avatar box now scales with the same screen-percentage popup size
// used in OverlayGestureContainer.tsx / TulipVoiceInteractionSession.kt, instead of
// a fixed 220x260 that assumed a fixed 260x340 popup. Keeps the avatar's proportion
// within the popup consistent (~85% of popup width, ~76% of popup height) no matter
// what the popup's actual size ends up being on a given device.
const POPUP_WIDTH_PERCENT = 0.45;
const POPUP_HEIGHT_PERCENT = 0.55;
const screenDimensions = Dimensions.get('window');
const AVATAR_WIDTH = screenDimensions.width * POPUP_WIDTH_PERCENT * 0.85;
const AVATAR_HEIGHT = screenDimensions.height * POPUP_HEIGHT_PERCENT * 0.76;

export default function OverlayRoot() {
  const [companionId, setCompanionId] = useState<CompanionId | null>(null);
  const {
    isSessionActive,
    isBannerVisible,
    triggerVoiceCommand,
    dismissBanner,
    closeSession,
  } = useAssistantSessionLifecycle();

  useEffect(() => {
    let active = true;
    loadSettings().then((settings) => {
      if (active) {
        setCompanionId(settings.selectedCompanion || DEFAULT_COMPANION);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!isSessionActive) {
    return null;
  }

  return (
    <OverlayGestureContainer>
      <View style={styles.container}>
        <View style={styles.contentColumn}>
          {!isBannerVisible && (
            <TouchableOpacity style={styles.simulateButton} onPress={triggerVoiceCommand}>
              <Text style={styles.simulateButtonText}>Simulate Voice Action</Text>
            </TouchableOpacity>
          )}

          {/* AO-6: voice action banner - start/end */}
          {isBannerVisible && (
            <OverlayVoiceActionBanner
              onConfirm={dismissBanner}
              onDismiss={dismissBanner}
              onCloseSession={closeSession}
            />
          )}

          {/* Avatar rendered last so it's the bottom-most element, flush against the
              popup's bottom edge, instead of sitting above the toggle/button. */}
          {companionId ? (
            // pointerEvents="none": the avatar is purely decorative (no touch
            // interaction of its own). Without this, its underlying GLView
            // (a native SurfaceView) can silently swallow touches meant for the
            // draggable '+' bubble whenever they visually overlap, since expo-gl's
            // native surface handles touch dispatch outside RN's normal responder
            // negotiation. This was the likely cause of the bubble not being
            // draggable on real-device testing (v49) - the bubble's default resting
            // position sits low, right where the bottom-anchored avatar is.
            <View style={styles.avatarContainer} pointerEvents="none">
              <CompanionAvatar companionId={companionId} />
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
        </View>

        {/* AO-4: feature bubble - now a draggable floating bubble spanning the whole
            popup area (not confined to the bottom content strip), so it can be
            dragged anywhere within the popup. Automatically mounts/unmounts with
            this whole screen - tied to isSessionActive above, not a separate toggle. */}
        <OverlayFeatureBubble />
      </View>
    </OverlayGestureContainer>
  );
}

const styles = StyleSheet.create({
  simulateButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.4)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  simulateButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  // AO-4 update: replaces the old opaque "glassCard" - no box/background behind the
  // avatar anymore, it renders straight onto the transparent popup per the reference
  // design (character floating on the transparent screen, no card).
  contentColumn: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    overflow: 'hidden',
  },
});
