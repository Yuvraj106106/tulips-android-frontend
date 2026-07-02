import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

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
      <View style={styles.container}>
        {!isVoiceMode ? (
          <>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
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
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  micButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  micButtonActive: {
    backgroundColor: '#FFE5E5',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  micIcon: { fontSize: 24 },
  micLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
});

export default InputBar;
