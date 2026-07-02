import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Text, PermissionsAndroid, Platform, Alert } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import InputBar from '../components/InputBar';
import FloatingBubble from '../services/FloatingBubble';
import { sendMessage } from '../services/api';
import { playBase64Audio, stopAudio } from '../services/audioPlayer';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
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
  const [isBubbleEnabled, setIsBubbleEnabled] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastTranscript = useRef('');
  const modeRef = useRef(mode);
  const listenerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const checkService = async () => {
      if (Platform.OS === 'android') {
        const running = await FloatingBubble.isServiceRunning();
        setIsBubbleEnabled(running);
      }
    };
    checkService();
  }, []);

  const processTranscript = async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    if (!text.trim()) { isProcessingRef.current = false; return; }
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
          if (modeRef.current === 'voice') {
            startListening();
          }
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

  useEffect(() => {
    if (ExpoSpeechRecognitionModule) {
      listenerRef.current = ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
        if (event.results?.[0]?.transcript) {
          const t = event.results[0].transcript;
          if (t && t !== lastTranscript.current) {
            lastTranscript.current = t;
            processTranscript(t);
          }
        }
      });
      ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
        console.error('STT error:', event);
        setSttError(event.message || 'Speech recognition error');
        setIsListening(false);
      });
    }
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
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
    lastTranscript.current = '';
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
        interimResults: false,
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

  const toggleFloatingBubble = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Floating bubble is only available on Android.');
      return;
    }

    if (isBubbleEnabled) {
      await FloatingBubble.stopBubble();
      setIsBubbleEnabled(false);
    } else {
      const hasPermission = await FloatingBubble.isPermissionGranted();
      if (hasPermission) {
        try {
          await FloatingBubble.startBubble();
          setIsBubbleEnabled(true);
        } catch (e) {
          Alert.alert('Error', 'Failed to start floating bubble.');
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Tulip needs "Display over other apps" permission for the floating bubble. Enable it in settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => FloatingBubble.requestPermission() },
          ]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Mode Toggle and Bubble Toggle */}
      <View style={styles.topBar}>
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
        <TouchableOpacity
          style={[styles.bubbleToggle, isBubbleEnabled && styles.bubbleActive]}
          onPress={toggleFloatingBubble}
        >
          <Text style={styles.bubbleToggleText}>{isBubbleEnabled ? '🫧 On' : '🫧 Off'}</Text>
        </TouchableOpacity>
      </View>

      {mode === 'voice' ? (
        <View style={styles.voiceContainer}>
          {/* Krishna 3D Avatar — waist-up, takes top 65% of screen */}
          <View style={styles.avatarContainer}>
            <KrishnaAvatar />
          </View>

          {/* Bottom controls */}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modeToggleContainer: {
    flexDirection: 'row', justifyContent: 'center', paddingVertical: 8,
  },
  bubbleToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#222',
  },
  bubbleActive: {
    backgroundColor: '#FFBF00',
  },
  bubbleToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeButton: {
    paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20,
    marginHorizontal: 5, backgroundColor: '#222',
  },
  activeMode: { backgroundColor: '#FFBF00' },
  modeButtonText: { fontSize: 16, color: '#aaa' },
  activeModeText: { color: '#000', fontWeight: 'bold' },
  messageList: { flex: 1, paddingHorizontal: 10 },

  // Voice mode
  voiceContainer: { flex: 1, flexDirection: 'column', backgroundColor: '#0a0a1a' },
  avatarContainer: {
    height: '65%',
    width: '100%',
  },
  voiceControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
