import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Settings, loadSettings, saveSettings } from '../services/settings';
import FloatingBubble from '../services/FloatingBubble';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isVisible, onClose, onSignOut }) => {
  const [settings, setSettings] = useState<Settings>({});
  const [permissions, setPermissions] = useState({
    microphone: false,
    floatingBubble: false,
    notifications: false,
  });

  useEffect(() => {
    if (isVisible) {
      loadCurrentSettings();
      checkPermissions();
    }
  }, [isVisible]);

  const loadCurrentSettings = async () => {
    const s = await loadSettings();
    setSettings(s);
  };

  const checkPermissions = async () => {
    const bubbleGranted = await FloatingBubble.isPermissionGranted();
    const permissionsResponse = await Notifications.getPermissionsAsync() as any;
    const notificationStatus = permissionsResponse.status;

    // For microphone, we'd typically use PermissionsAndroid or expo-av
    // Keeping it simple for now as it's checked during chat

    setPermissions({
      microphone: false, // Placeholder or use actual check
      floatingBubble: bubbleGranted,
      notifications: notificationStatus === 'granted',
    });
  };

  const updateSetting = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(updates);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'Are you sure you want to clear all local settings and history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await saveSettings({
              language: undefined,
              permissionsGranted: false,
              onboardingComplete: false,
              user: undefined,
              voiceEnabled: true,
              voiceSpeed: 'normal',
              notificationsEnabled: true,
              selectedCompanion: 'krishna',
            });
            onSignOut();
          },
        },
      ]
    );
  };

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderDivider = () => <View style={styles.divider} />;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <BlurView intensity={80} tint="dark" style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* ACCOUNT */}
            <View style={styles.section}>
              {renderSectionTitle('ACCOUNT')}
              <View style={styles.row}>
                <View>
                  <Text style={styles.rowLabel}>{settings.user?.name || 'Krishna Bhakt'}</Text>
                  <Text style={styles.rowSubLabel}>{settings.user?.email || 'No email yet'}</Text>
                  <Text style={styles.rowSubLabel}>{settings.phone || settings.user?.phoneNumber || 'No phone'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={onSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled style={[styles.actionButton, { opacity: 0.5 }]}>
                <Text style={styles.buttonText}>Edit Profile (Coming Soon)</Text>
              </TouchableOpacity>
            </View>

            {renderDivider()}

            {/* LANGUAGE */}
            <View style={styles.section}>
              {renderSectionTitle('LANGUAGE')}
              <View style={styles.languageOptions}>
                {(['Hindi', 'Hinglish', 'English'] as const).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.langButton,
                      settings.language === lang && styles.langButtonActive,
                    ]}
                    onPress={() => updateSetting({ language: lang })}
                  >
                    <Text
                      style={[
                        styles.langButtonText,
                        settings.language === lang && styles.langButtonTextActive,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderDivider()}

            {/* VOICE */}
            <View style={styles.section}>
              {renderSectionTitle('VOICE')}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Voice Enabled</Text>
                <Switch
                  value={settings.voiceEnabled}
                  onValueChange={(v) => updateSetting({ voiceEnabled: v })}
                  trackColor={{ false: '#3e3e3e', true: COLORS.primary }}
                  thumbColor={settings.voiceEnabled ? '#fff' : '#f4f3f4'}
                />
              </View>
              <Text style={[styles.rowLabel, { marginTop: SPACING.md }]}>Voice Speed</Text>
              <View style={styles.speedOptions}>
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedButton,
                      settings.voiceSpeed === speed && styles.speedButtonActive,
                    ]}
                    onPress={() => updateSetting({ voiceSpeed: speed })}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        settings.voiceSpeed === speed && styles.speedButtonTextActive,
                      ]}
                    >
                      {speed.charAt(0).toUpperCase() + speed.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderDivider()}

            {/* PERMISSIONS */}
            <View style={styles.section}>
              {renderSectionTitle('PERMISSIONS')}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Floating Bubble</Text>
                <Text style={[styles.statusText, permissions.floatingBubble ? styles.granted : styles.denied]}>
                  {permissions.floatingBubble ? 'Granted' : 'Denied'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Notifications</Text>
                <Text style={[styles.statusText, permissions.notifications ? styles.granted : styles.denied]}>
                  {permissions.notifications ? 'Granted' : 'Denied'}
                </Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openSettings()}>
                <Text style={styles.buttonText}>Open App Settings</Text>
              </TouchableOpacity>
            </View>

            {renderDivider()}

            {/* COMPANION */}
            <View style={styles.section}>
              {renderSectionTitle('COMPANION')}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Current: {settings.selectedCompanion === 'krishna' ? 'Krishna' : 'Other'}</Text>
              </View>
              <TouchableOpacity disabled style={[styles.actionButton, { opacity: 0.5 }]}>
                <Text style={styles.buttonText}>Change Companion (Coming Soon)</Text>
              </TouchableOpacity>
            </View>

            {renderDivider()}

            {/* NOTIFICATIONS */}
            <View style={styles.section}>
              {renderSectionTitle('NOTIFICATIONS')}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Enable Push Notifications</Text>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(v) => updateSetting({ notificationsEnabled: v })}
                  trackColor={{ false: '#3e3e3e', true: COLORS.primary }}
                />
              </View>
              <Text style={styles.todoText}>// TODO: Backend wiring needed</Text>
            </View>

            {renderDivider()}

            {/* ABOUT */}
            <View style={styles.section}>
              {renderSectionTitle('ABOUT / DATA')}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>App Version</Text>
                <Text style={styles.rowSubLabel}>{Constants.expoConfig?.version || '1.0.0'}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={handleClearData}>
                <Text style={styles.clearText}>Clear Local Data</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: SPACING.xxl }} />
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    height: '85%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  rowSubLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  signOutText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  clearText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  langButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  langButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  speedOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  speedButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  speedButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  statusText: {
    fontWeight: 'bold',
  },
  granted: {
    color: COLORS.success,
  },
  denied: {
    color: COLORS.error,
  },
  todoText: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
});

export default SettingsPanel;
