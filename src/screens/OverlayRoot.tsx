import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import CompanionAvatar from '../components/CompanionAvatar';
import { loadSettings } from '../services/settings';
import { CompanionId, DEFAULT_COMPANION } from '../companions/config';
import OverlayFeatureBubble from '../components/OverlayFeatureBubble';
import { useAssistantSessionLifecycle } from '../hooks/useAssistantSessionLifecycle';
import { OverlayVoiceActionBanner } from '../components/OverlayVoiceActionBanner';
import OverlayGestureContainer from '../components/OverlayGestureContainer';

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
          {/* AO-4: feature bubble - start */}
          <OverlayFeatureBubble />
          {/* AO-4: feature bubble - end */}

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
            <View style={styles.avatarContainer}>
              <CompanionAvatar companionId={companionId} />
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
        </View>
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
    width: 220,
    height: 260,
    overflow: 'hidden',
  },
});
