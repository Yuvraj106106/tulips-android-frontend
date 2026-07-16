import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import CompanionAvatar from '../components/CompanionAvatar';
import { loadSettings } from '../services/settings';
import { CompanionId, DEFAULT_COMPANION } from '../companions/config';
import OverlayFeatureBubble from '../components/OverlayFeatureBubble';
import { useAssistantSessionLifecycle } from '../hooks/useAssistantSessionLifecycle';
import { OverlayVoiceActionBanner } from '../components/OverlayVoiceActionBanner';

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
    <View style={styles.container}>
      <View style={styles.glassCard}>
        {companionId ? (
          <View style={styles.avatarContainer}>
            <CompanionAvatar companionId={companionId} />
          </View>
        ) : (
          <ActivityIndicator size="large" color={COLORS.primary} />
        )}
        <Text style={styles.title}>Krishna AI</Text>
        <Text style={styles.subtitle}>RN mounted in overlay</Text>
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
      </View>
    </View>
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 240,
    height: 320,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  glassCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
  },
});
