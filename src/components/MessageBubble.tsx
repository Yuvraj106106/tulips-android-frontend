import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING } from '../constants/theme';

interface MessageBubbleProps {
  text: string;
  sender: 'user' | 'krishna';
  timestamp: string;
  audioUrl?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, timestamp, audioUrl }) => {
  const isUser = sender === 'user';
  const [playing, setPlaying] = useState(false);

  const playAudio = async () => {
    if (playing || !audioUrl) return;
    setPlaying(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      setPlaying(false);
      console.error('Audio playback error:', error);
    }
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.krishnaContainer]}>
      {isUser ? (
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{text}</Text>
          <Text style={styles.userTimestamp}>{timestamp}</Text>
        </View>
      ) : (
        <BlurView intensity={40} tint="dark" style={[styles.bubble, styles.krishnaBubble]}>
          <Text style={styles.krishnaText}>{text}</Text>
          {audioUrl && (
            <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
              <Text style={styles.audioButtonText}>{playing ? 'Playing...' : '🔊 Play'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.krishnaTimestamp}>{timestamp}</Text>
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 5, flexDirection: 'row', width: '100%' },
  userContainer: { justifyContent: 'flex-end' },
  krishnaContainer: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: SPACING.sm + 2, borderRadius: 18, overflow: 'hidden' },
  userBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomRightRadius: 4,
  },
  krishnaBubble: {
    backgroundColor: 'rgba(255, 191, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.35)',
    borderBottomLeftRadius: 4,
  },
  userText: { color: COLORS.text, fontSize: 16 },
  krishnaText: { color: COLORS.text, fontSize: 16 },
  userTimestamp: { color: COLORS.textSecondary, fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  krishnaTimestamp: { color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  audioButton: { marginTop: 8, padding: 8, backgroundColor: 'rgba(255, 191, 0, 0.15)', borderRadius: 8, alignSelf: 'flex-start' },
  audioButtonText: { color: COLORS.primary, fontSize: 14 },
});

export default MessageBubble;
