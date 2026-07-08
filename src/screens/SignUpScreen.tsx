import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

type RootStackParamList = {
  SignUp: undefined;
  Language: undefined;
};

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={TYPOGRAPHY.h2}>Sign Up Screen</Text>
        <Text style={styles.placeholderText}>[Placeholder for Parallel Branch]</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Language')}
        >
          <Text style={styles.buttonText}>Continue to Language</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  placeholderText: {
    ...TYPOGRAPHY.caption,
    marginVertical: SPACING.md,
    opacity: 0.6,
  },
  button: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
