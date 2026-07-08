import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, PermissionsAndroid, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';
import FloatingBubble from '../services/FloatingBubble';

type RootStackParamList = {
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type PermissionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Permissions'>;

interface Props {
  navigation: PermissionsScreenNavigationProp;
}

const PermissionsScreen: React.FC<Props> = ({ navigation }) => {
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request Microphone Permission
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Tulip needs access to your microphone to hear you.',
            buttonPositive: 'OK',
          },
        );

        // Overlay Permission (Floating Bubble)
        const hasOverlayPermission = await FloatingBubble.isPermissionGranted();
        if (!hasOverlayPermission) {
          FloatingBubble.requestPermission();
          // We can't easily wait for this one as it opens settings,
          // but we proceed to let the user come back or continue.
        }

        // Notification Permission (Android 13+)
        if (Platform.Version >= 33) {
          await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS' as any
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }

    await saveSettings({ permissionsGranted: true });
    navigation.replace('AvatarSelect');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Permissions required</Text>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionIcon}>🎤</Text>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>Microphone</Text>
            <Text style={styles.permissionDescription}>"Bolke baat karne ke liye"</Text>
          </View>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionIcon}>🫧</Text>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>Display over other apps</Text>
            <Text style={styles.permissionDescription}>"Screen pe saath rehne ke liye"</Text>
          </View>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionIcon}>🔔</Text>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>Notifications</Text>
            <Text style={styles.permissionDescription}>"Yaad dilane ke liye"</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={requestPermissions}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  permissionDescription: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default PermissionsScreen;
