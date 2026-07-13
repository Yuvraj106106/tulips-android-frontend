import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { BACKEND_URL, BACKEND_API_SECRET, TEMP_USER_ID } from '../constants/config';
import { loadSettings } from '../services/settings';

interface MemoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

type MemoryCategory = 'goals' | 'struggles' | 'importantPeople' | 'milestones' | 'emotionalPatterns';

type Memory = Record<MemoryCategory, string[]>;

const EMPTY_MEMORY: Memory = {
  goals: [],
  struggles: [],
  importantPeople: [],
  milestones: [],
  emotionalPatterns: [],
};

const CATEGORY_LABELS: { key: MemoryCategory; label: string }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'struggles', label: 'Struggles' },
  { key: 'importantPeople', label: 'Important People' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'emotionalPatterns', label: 'Emotional Patterns' },
];

const MemoryPanel: React.FC<MemoryPanelProps> = ({ isVisible, onClose }) => {
  const [memory, setMemory] = useState<Memory>(EMPTY_MEMORY);
  const [loading, setLoading] = useState(false);
  const [companionName, setCompanionName] = useState('Krishna');

  useEffect(() => {
    if (isVisible) {
      loadMemory();
    }
  }, [isVisible]);

  const getUserId = async () => {
    // Must match src/services/api.ts resolution: real signed-in userId, falling
    // back to TEMP_USER_ID only if the user hasn't signed in yet.
    const settings = await loadSettings();
    return settings.userId || TEMP_USER_ID;
  };

  const loadMemory = async () => {
    setLoading(true);
    try {
      const settings = await loadSettings();
      if (settings.selectedCompanion) {
        setCompanionName(
          settings.selectedCompanion.charAt(0).toUpperCase() + settings.selectedCompanion.slice(1)
        );
      }

      const userId = await getUserId();
      const response = await fetch(`${BACKEND_URL}/api/memory/${userId}`, {
        headers: { 'x-api-secret': BACKEND_API_SECRET },
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      setMemory({ ...EMPTY_MEMORY, ...data });
    } catch (error) {
      console.error('Error loading memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (category: MemoryCategory, index: number) => {
    try {
      const userId = await getUserId();
      const response = await fetch(`${BACKEND_URL}/api/memory/${userId}/${category}/${index}`, {
        method: 'DELETE',
        headers: { 'x-api-secret': BACKEND_API_SECRET },
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      setMemory({ ...EMPTY_MEMORY, ...data });
    } catch (error) {
      console.error('Error deleting memory item:', error);
      Alert.alert('Error', 'Item delete nahi ho paya. Dobara try karo.');
    }
  };

  const clearAllMemory = () => {
    Alert.alert(
      'Clear All Memory',
      `${companionName} tumhari saari yaad rakhi baatein bhool jayega. Ye undo nahi ho sakta.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await getUserId();
              const response = await fetch(`${BACKEND_URL}/api/memory/${userId}`, {
                method: 'DELETE',
                headers: { 'x-api-secret': BACKEND_API_SECRET },
              });
              if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
              setMemory(EMPTY_MEMORY);
            } catch (error) {
              console.error('Error clearing memory:', error);
              Alert.alert('Error', 'Memory clear nahi ho payi. Dobara try karo.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <BlurView intensity={80} tint="dark" style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{companionName} tumhare baare mein ye jaanta hai</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {CATEGORY_LABELS.map(({ key, label }) => (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{label.toUpperCase()}</Text>
                  {memory[key] && memory[key].length > 0 ? (
                    memory[key].map((item, index) => (
                      <View key={`${key}-${index}`} style={styles.row}>
                        <Text style={styles.itemText}>{item}</Text>
                        <TouchableOpacity
                          onPress={() => deleteItem(key, index)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Abhi kuch nahi pata</Text>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.clearButton} onPress={clearAllMemory}>
                <Text style={styles.clearButtonText}>Clear All Memory</Text>
              </TouchableOpacity>

              <View style={{ height: SPACING.xxl }} />
            </ScrollView>
          )}
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    height: '85%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  itemText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginRight: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
  },
  deleteButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  clearButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: 'bold',
  },
});

export default MemoryPanel;
