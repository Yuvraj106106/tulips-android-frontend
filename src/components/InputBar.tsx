import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING } from '../constants/theme';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onMicPress?: () => void;
  onMicRelease?: () => void;
  isListening?: boolean;
  isVoiceMode?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  onMicPress,
  onMicRelease,
  isListening = false,
  isVoiceMode = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim().length > 0) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <BlurView intensity={60} tint="dark" style={styles.container}>
        {!isVoiceMode ? (
          <>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPressIn={onMicPress}
            onPressOut={onMicRelease}
            activeOpacity={0.7}
          >
            <Text style={styles.micIcon}>{isListening ? '🔴' : '🎙️'}</Text>
            <Text style={styles.micLabel}>
              {isListening ? 'Listening...' : 'Hold to Speak'}
            </Text>
          </TouchableOpacity>
        )}
      </BlurView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.sm + 2,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16 },
  micButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  micButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  micIcon: { fontSize: 24 },
  micLabel: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
});

export default InputBar;
