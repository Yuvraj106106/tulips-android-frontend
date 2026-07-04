import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Text, PermissionsAndroid, Platform } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import InputBar from '../components/InputBar';
import { sendMessage } from '../services/api';
import { playBase64Audio, stopAudio } from '../services/audioPlayer';
import { ExpoSpeechRecognitionModule, ExpoSpeechRecognitionModuleEmitter } from 'expo-speech-recognition';
import { Audio } from 'expo-av';
import KrishnaAvatar from '../components/KrishnaAvatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'krishna';
  timestamp: string;
}

const CONVERSATION_ID = 'default_conversation';

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am Krishna, your AI companion. How can I help you today?',
      sender: 'krishna',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const modeRef = useRef(mode);
  const isProcessingRef = useRef(false);
  const pendingTranscript = useRef('');
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<{ remove: () => void }[]>([]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(l => l.remove());
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  const processFinalTranscript = async () => {
    const text = pendingTranscript.current.trim();
    pendingTranscript.current = '';
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    if (!text || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendMessage(text, CONVERSATION_ID);
      const krishnaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply || 'Sorry, I couldn\'t process that.',
        sender: 'krishna',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, krishnaMessage]);
      if (modeRef.current === 'voice' && response.audioBase64) {
        await playBase64Audio(response.audioBase64, () => {
          if (modeRef.current === 'voice') startListening();
        });
      }
    } catch (error: any) {
      let errorText = 'I am having trouble connecting right now.';
      if (error.message === 'TIMEOUT') errorText = 'Krishna is waking up... Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'krishna',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const scheduleSend = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(processFinalTranscript, 1000); // 1 second silence
  };

  useEffect(() => {
    const resultSub = ExpoSpeechRecognitionModuleEmitter.addListener('result', (event: any) => {
      // Only act on final result
      if (event.isFinal && event.results?.length > 0) {
        pendingTranscript.current = event.results[0].transcript || '';
        scheduleSend();
      }
    });

    const endSub = ExpoSpeechRecognitionModuleEmitter.addListener('end', () => {
      // If there's pending text, send immediately
      if (pendingTranscript.current.trim()) {
        processFinalTranscript();
      }
      setIsListening(false);
    });

    const errorSub = ExpoSpeechRecognitionModuleEmitter.addListener('error', (event: any) => {
      console.error('STT error:', event);
      setSttError(event.message || 'Speech recognition error');
      setIsListening(false);
    });

    listenersRef.current = [resultSub, endSub, errorSub];

    return () => {
      resultSub.remove();
      endSub.remove();
      errorSub.remove();
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text || !text.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await sendMessage(text, CONVERSATION_ID);
      const krishnaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply || 'Sorry, I couldn\'t process that.',
        sender: 'krishna',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, krishnaMessage]);
      if (mode === 'voice' && response.audioBase64) {
        await playBase64Audio(response.audioBase64);
      }
    } catch (error: any) {
      let errorText = 'I am having trouble connecting right now.';
      if (error.message === 'TIMEOUT') errorText = 'Krishna is waking up... Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'krishna',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const startListening = async () => {
    if (isProcessingRef.current) return;
    setSttError(null);
    pendingTranscript.current = '';
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {}

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Tulip needs access to your microphone to hear you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setSttError('Microphone permission not granted.');
          return;
        }
      } catch (err) {
        setSttError('Permission request failed.');
        return;
      }
    }

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: false,
      });
      setIsListening(true);
    } catch (e: any) {
      setSttError(e.message || 'Failed to start speech recognition');
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (e) {}
    setIsListening(false);
  };

  const handleMicPress = async () => {
    if (isListening) {
      stopListening();
    } else {
      await stopAudio();
      startListening();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'text' && styles.activeMode]}
          onPress={() => setMode('text')}
        >
          <Text style={[styles.modeButtonText, mode === 'text' && styles.activeModeText]}>Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'voice' && styles.activeMode]}
          onPress={() => setMode('voice')}
        >
          <Text style={[styles.modeButtonText, mode === 'voice' && styles.activeModeText]}>Voice</Text>
        </TouchableOpacity>
      </View>

      {mode === 'voice' ? (
        <View style={styles.voiceContainer}>
          <View style={styles.avatarContainer}>
            <KrishnaAvatar />
          </View>
          <View style={styles.voiceControls}>
            <Text style={styles.voiceStatus}>
              {isListening ? 'Listening...' : 'Tap mic to speak'}
            </Text>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micActive]}
              onPress={handleMicPress}
            >
              <Text style={styles.micIcon}>{isListening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
            {sttError && (
              <Text style={styles.errorText}>{sttError}</Text>
            )}
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.messageList}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                text={msg.text}
                sender={msg.sender}
                timestamp={msg.timestamp}
              />
            ))}
          </ScrollView>
          <InputBar onSendMessage={handleSendMessage} />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  modeToggleContainer: {
    flexDirection: 'row', justifyContent: 'center', paddingVertical: 8,
    backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222',
  },
  modeButton: {
    paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20,
    marginHorizontal: 5, backgroundColor: '#222',
  },
  activeMode: { backgroundColor: '#FFBF00' },
  modeButtonText: { fontSize: 16, color: '#aaa' },
  activeModeText: { color: '#000', fontWeight: 'bold' },
  messageList: { flex: 1, paddingHorizontal: 10 },
  voiceContainer: { flex: 1, flexDirection: 'column', backgroundColor: '#0a0a1a' },
  avatarContainer: { height: '65%', width: '100%' },
  voiceControls: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  voiceStatus: { fontSize: 18, color: '#aaa', marginBottom: 20 },
  micButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFBF00', justifyContent: 'center', alignItems: 'center',
  },
  micActive: { backgroundColor: '#FF3B30' },
  micIcon: { fontSize: 40 },
  errorText: { marginTop: 15, color: '#FF3B30', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});

export default ChatScreen;
