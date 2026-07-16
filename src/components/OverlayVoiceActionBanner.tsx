import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface OverlayVoiceActionBannerProps {
  onConfirm: () => void;
  onDismiss: () => void;
  onCloseSession: () => void;
}

/**
 * OverlayVoiceActionBanner Component (AO-6)
 *
 * Displays a glass-morphic feedback banner asking "Sahi laga?" after a
 * voice command executes. Features confirm/dismiss buttons and an explicit close
 * action that shuts down the assistant overlay session.
 */
export const OverlayVoiceActionBanner: React.FC<OverlayVoiceActionBannerProps> = ({
  onConfirm,
  onDismiss,
  onCloseSession,
}) => {
  return (
    <View style={styles.bannerContainer}>
      {/* Explicit Close Button */}
      <TouchableOpacity style={styles.closeIconButton} onPress={onCloseSession} activeOpacity={0.7}>
        <Text style={styles.closeIconText}>×</Text>
      </TouchableOpacity>

      {/* Confirmation Message */}
      <Text style={styles.promptText}>Sahi laga?</Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onConfirm} activeOpacity={0.7}>
          <Text style={styles.confirmButtonText}>Haan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissButtonText}>Nahi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 191, 0, 0.4)',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  promptText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 191, 0, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    minWidth: 100,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dismissButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  closeIconButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OverlayVoiceActionBanner;
