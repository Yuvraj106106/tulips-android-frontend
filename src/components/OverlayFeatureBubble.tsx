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
  Animated,
  PanResponder,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { loadSettings, saveSettings } from '../services/settings';
import MessageBubble from './MessageBubble';

const BUBBLE_SIZE = 44;
const TAP_MOVE_THRESHOLD = 6; // px of movement below which a gesture counts as a tap, not a drag
// CSS anchor for the toolbar's resting position (bottom-left), matching the
// `bubbleAnchor` style below. `pan` tracks drag offset relative to this.
const ANCHOR_LEFT = 12;
const ANCHOR_BOTTOM = 12;

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

  // Floating-bubble drag state: `pan` now tracks a DELTA offset from the
  // bubble's CSS-anchored resting position (bottom-left, see `bubbleAnchor`
  // style), not an absolute top-left coordinate computed from measured layout.
  //
  // v53 fix: the previous approach hardcoded an initial pan value assuming a
  // static ~340px-tall collapsed popup, then corrected it to the real bottom
  // only after `onLayout` fired with the live full-screen height. That's a
  // race - if `onLayout` is ever delayed, skipped, or fires against a stale
  // size (as suspected on the real outside-app launch path), the bubble was
  // stuck rendering near the OLD hardcoded y, which reads as "floating near
  // the top / above the avatar's head" on a real full-height screen. Anchoring
  // the resting position via CSS `bottom`/`left` removes that dependency
  // entirely - the bubble is correctly at the bottom on the very first frame,
  // with `pan` only ever representing how far the user has dragged it away
  // from that anchor.
  const [bounds, setBounds] = useState({ width: 260, height: 340 });
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragDistance = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Defensive: also claim in the capture phase, so a touch that starts on the
      // bubble is never handed to OverlayGestureContainer's swipe-up-to-expand
      // PanResponder (which is attached higher up, on the whole popup) instead.
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset();
        dragDistance.current = 0;
      },
      onPanResponderMove: (evt, gesture) => {
        dragDistance.current = Math.abs(gesture.dx) + Math.abs(gesture.dy);
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gesture);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Clamp the resting position to stay fully within the popup bounds.
        // `pan` is now a delta from the CSS-anchored resting spot
        // (ANCHOR_LEFT, bottom: ANCHOR_BOTTOM), so convert to/from absolute
        // popup-relative coordinates around that baseline for the clamp math.
        const anyPan = pan as any;
        const baselineX = ANCHOR_LEFT;
        const baselineY = bounds.height - BUBBLE_SIZE - ANCHOR_BOTTOM;
        const currentAbsX = baselineX + anyPan.x._value;
        const currentAbsY = baselineY + anyPan.y._value;
        const clampedAbsX = Math.max(0, Math.min(bounds.width - BUBBLE_SIZE, currentAbsX));
        const clampedAbsY = Math.max(0, Math.min(bounds.height - BUBBLE_SIZE, currentAbsY));
        const clampedDx = clampedAbsX - baselineX;
        const clampedDy = clampedAbsY - baselineY;
        if (clampedAbsX !== currentAbsX || clampedAbsY !== currentAbsY) {
          Animated.spring(pan, {
            toValue: { x: clampedDx, y: clampedDy },
            useNativeDriver: false,
          }).start();
        }

        // Barely moved -> treat as a tap, toggle the expand/collapse row.
        if (dragDistance.current < TAP_MOVE_THRESHOLD) {
          setExpanded((prev) => !prev);
        }
      },
    })
  ).current;

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
    <View
      style={styles.floatingLayer}
      pointerEvents="box-none"
      onLayout={(e) => {
        // Only used to bound how far the bubble can be dragged. The bubble's
        // default resting position no longer depends on this firing at all -
        // it's anchored via CSS (`bubbleAnchor` below), so it's correct on
        // the very first frame even if this callback is delayed or never
        // fires with a live size.
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setBounds({ width, height });
        }
      }}
    >
      <Animated.View
        style={[styles.bubbleAnchor, { transform: pan.getTranslateTransform() }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* AO-4 update: '+' is now a draggable floating bubble (chat-head style) -
              tap it (no significant movement) to expand/collapse the icon row, or
              drag it anywhere within the popup to reposition it. Only the collapsed
              bubble itself is draggable; the expanded row is a static tappable panel
              anchored at wherever the bubble currently sits. */}
          {!expanded ? (
            <View style={styles.expandToggle} {...panResponder.panHandlers}>
              <Text style={styles.expandToggleIcon}>+</Text>
            </View>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubbleAnchor: {
    // Anchored to the bottom-left of the popup (matches ANCHOR_LEFT/
    // ANCHOR_BOTTOM above). `pan`'s translateX/Y then only ever represents a
    // drag delta away from this fixed resting spot - so it renders correctly
    // at the bottom on the first frame with no dependency on onLayout timing.
    // Growing content (e.g. the expanded icon row) pushes upward from this
    // fixed bottom edge, which is what naturally overlays it on top of the
    // avatar near the bottom without shifting the avatar's own layout.
    position: 'absolute',
    left: ANCHOR_LEFT,
    bottom: ANCHOR_BOTTOM,
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
    width: 240,
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
