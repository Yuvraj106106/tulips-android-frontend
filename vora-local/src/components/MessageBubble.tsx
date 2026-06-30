import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

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
        if (status.didJustFinish) {
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
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.krishnaBubble]}>
        <Text style={styles.text}>{text}</Text>
        {!isUser && audioUrl && (
          <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
            <Text style={styles.audioButtonText}>{playing ? 'Playing...' : '🔊 Play'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    flexDirection: 'row',
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  krishnaContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 2,
  },
  krishnaBubble: {
    backgroundColor: '#FFBF00',
    borderBottomLeftRadius: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  audioButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default MessageBubble;