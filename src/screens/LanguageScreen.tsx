import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';

type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  Language: undefined;
  Permissions: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type LanguageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Language'>;

interface Props {
  navigation: LanguageScreenNavigationProp;
}

const LanguageScreen: React.FC<Props> = ({ navigation }) => {
  const selectLanguage = async (language: 'Hindi' | 'Hinglish' | 'English') => {
    await saveSettings({ language });
    navigation.replace('Permissions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Aap kaunsi bhasha mein comfortable hain?</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => selectLanguage('Hindi')}
          >
            <Text style={styles.buttonText}>Hindi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => selectLanguage('Hinglish')}
          >
            <Text style={styles.buttonText}>Hinglish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => selectLanguage('English')}
          >
            <Text style={styles.buttonText}>English</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});

export default LanguageScreen;
