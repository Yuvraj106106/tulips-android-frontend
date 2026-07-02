import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  text: string;
  sender: "user" | "krishna";
  timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, timestamp }) => {
  const isUser = sender === "user";
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.krishnaContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.krishnaBubble]}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 5, flexDirection: "row", width: "100%" },
  userContainer: { justifyContent: "flex-end" },
  krishnaContainer: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 15 },
  userBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 2 },
  krishnaBubble: { backgroundColor: "#FFBF00", borderBottomLeftRadius: 2 },
  text: { color: "#FFFFFF", fontSize: 16 },
  krishnaText: { color: "#000000" },
  timestamp: { color: "rgba(0,0,0,0.4)", fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
});

export default MessageBubble;