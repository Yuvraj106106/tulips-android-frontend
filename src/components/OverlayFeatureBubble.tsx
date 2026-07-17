import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { loadSettings, saveSettings } from '../services/settings';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'krishna';
  timestamp: string;
}

interface ButtonConfig {
  id: string;
  getIcon: (state: any) => string;
  getLabel: (state: any) => string;
  getIsActive: (state: any) => boolean;
  onPress: (helpers: {
    toggleChat: () => void;
    toggleMic: () => Promise<void>;
    toggleHandsFree: () => Promise<void>;
    triggerScreenShare: () => void;
    triggerCameraMode: () => void;
  }) => void | Promise<void>;
}

// Data-driven list of feature bubble action buttons
const BUTTON_CONFIGS: ButtonConfig[] = [
  {
    id: 'chat',
    getIcon: (state) => '💬',
    getLabel: (state) => 'Chat',
    getIsActive: (state) => !!state.chatOpen,
    onPress: ({ toggleChat }) => toggleChat(),
  },
  {
    id: 'mic',
    getIcon: (state) => (state.micEnabled ? '🎙️' : '🔇'),
    getLabel: (state) => (state.micEnabled ? 'Mic On' : 'Mic Off'),
    getIsActive: (state) => !!state.micEnabled,
    onPress: ({ toggleMic }) => toggleMic(),
  },
  {
    id: 'handsFree',
    getIcon: (state) => (state.handsFreeEnabled ? '🙌' : '✊'),
    getLabel: (state) => 'Hands-Free',
    getIsActive: (state) => !!state.handsFreeEnabled,
    onPress: ({ toggleHandsFree }) => toggleHandsFree(),
  },
  {
    id: 'screenShare',
    getIcon: () => '📲',
    getLabel: () => 'Share',
    getIsActive: () => false,
    onPress: ({ triggerScreenShare }) => triggerScreenShare(),
  },
  {
    id: 'camera',
    getIcon: () => '📷',
    getLabel: () => 'Camera',
    getIsActive: () => false,
    onPress: ({ triggerCameraMode }) => triggerCameraMode(),
  },
];

export default function OverlayFeatureBubble() {
  const [expanded, setExpanded] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [handsFreeEnabled, setHandsFreeEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hare Krishna! How can I assist you in the overlay?',
      sender: 'krishna',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load persistent settings on mount
  useEffect(() => {
    loadSettings().then((settings) => {
      if (settings.micEnabled !== undefined) {
        setMicEnabled(settings.micEnabled);
      }
      if (settings.handsFreeEnabled !== undefined) {
        setHandsFreeEnabled(settings.handsFreeEnabled);
      }
    });
  }, []);

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
  };

  const toggleMic = async () => {
    const newVal = !micEnabled;
    setMicEnabled(newVal);
    await saveSettings({ micEnabled: newVal });
  };

  const toggleHandsFree = async () => {
    const newVal = !handsFreeEnabled;
    setHandsFreeEnabled(newVal);
    await saveSettings({ handsFreeEnabled: newVal });
  };

  const triggerScreenShare = () => {
    // TODO: Needs native screen-capture work in a later phase
    console.log('[OverlayFeatureBubble] Screen share icon tapped. Stub only.');
    alert('Screen sharing will be supported in a future update.');
  };

  const triggerCameraMode = () => {
    // TODO: Needs camera pipeline integration in a later phase
    console.log('[OverlayFeatureBubble] Camera mode icon tapped. Stub only.');
    alert('Camera mode will be supported in a future update.');
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
  };

  // Build the helper bag for mapped actions
  const helpers = {
    toggleChat,
    toggleMic,
    toggleHandsFree,
    triggerScreenShare,
    triggerCameraMode,
  };

  // Gather current state for active/icon representation
  const currentState = {
    micEnabled,
    handsFreeEnabled,
    chatOpen,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* AO-4 update: '+' expand/collapse toggle instead of an always-open icon row,
          per the hand-drawn spec - tap '+' to reveal the row, tap it again (now shown
          as '×') to collapse it back. */}
      {!expanded ? (
        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => setExpanded(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandToggleIcon}>+</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.expandedRow}>
          <View style={styles.buttonRow}>
            {BUTTON_CONFIGS.map((btn) => {
              const isActive = btn.getIsActive(currentState);
              return (
                <TouchableOpacity
                  key={btn.id}
                  style={[styles.button, isActive && styles.buttonActive]}
                  onPress={() => btn.onPress(helpers)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonIcon}>{btn.getIcon(currentState)}</Text>
                  <Text style={styles.buttonLabel}>{btn.getLabel(currentState)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.collapseToggle}
            onPress={() => setExpanded(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandToggleIcon}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lightweight Chat Pane */}
      {chatOpen && (
        <View style={styles.chatPane}>
          <ScrollView
            style={styles.messageScroll}
            contentContainerStyle={styles.messageScrollContent}
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

          {/* Lightweight Input Bar matching the design language */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  expandToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 191, 0, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  collapseToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 191, 0, 0.85)',
    marginLeft: SPACING.xs,
  },
  expandToggleIcon: {
    fontSize: 20,
    color: '#0a0a1a',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(10, 10, 26, 0.55)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.25)',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 16,
    minWidth: 60,
  },
  buttonActive: {
    backgroundColor: 'rgba(255, 191, 0, 0.15)',
    borderColor: 'rgba(255, 191, 0, 0.4)',
    borderWidth: 1,
  },
  buttonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '500',
  },
  chatPane: {
    width: '100%',
    maxHeight: 250,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  messageScroll: {
    flex: 1,
    maxHeight: 180,
  },
  messageScrollContent: {
    padding: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    fontSize: 14,
    maxHeight: 60,
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sendButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
