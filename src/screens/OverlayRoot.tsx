import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import CompanionAvatar from '../components/CompanionAvatar';
import { loadSettings } from '../services/settings';
import { CompanionId, DEFAULT_COMPANION } from '../companions/config';
import OverlayGestureContainer from '../components/OverlayGestureContainer';

export default function OverlayRoot() {
  const [companionId, setCompanionId] = useState<CompanionId | null>(null);

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

  return (
    <OverlayGestureContainer>
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
        </View>
      </View>
    </OverlayGestureContainer>
  );
}

const styles = StyleSheet.create({
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
