import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import { Asset } from 'expo-asset';
import { companions, CompanionId, CompanionConfig } from '../companions/config';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.75;
const ITEM_SPACING = (width - ITEM_WIDTH) / 2;

type RootStackParamList = {
  AvatarSelect: undefined;
  CinematicIntro: undefined;
};

type AvatarSelectNavigationProp = StackNavigationProp<RootStackParamList, 'AvatarSelect'>;

interface Props {
  navigation: AvatarSelectNavigationProp;
}

const AvatarSelectScreen: React.FC<Props> = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const companionList = useMemo(() => Object.values(companions), []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    setSelectedIndex(index);
  };

  const handleConfirm = async () => {
    const selected = companionList[selectedIndex];
    if (!selected) return;

    // (a) save the selected companion ID
    await saveSettings({ selectedCompanion: selected.id });

    // (c) kick off the actual companion GLB download in the background
    Asset.fromModule(selected.modelAsset).downloadAsync().catch(err => {
      console.error(`Background GLB download failed for ${selected.id}:`, err);
    });

    // (b) immediately navigate to AvatarIntro (CinematicIntro) screen
    navigation.replace('CinematicIntro' as any);
  };

  const renderItem = ({ item, index }: { item: CompanionConfig; index: number }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width: ITEM_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
            <View style={[styles.avatarPlaceholder, { borderColor: item.themeColor }]}>
               {/*
                  Note: Instructions say "don't touch CompanionAvatar.tsx",
                  and we are just doing selection here.
                  A simple emoji/text representation for the carousel card is fine
                  or we could use CompanionAvatar but that might be heavy for a carousel.
                  I'll use a stylized name/color for now.
               */}
               <Text style={[styles.avatarEmoji, { color: item.themeColor }]}>
                 {item.id === 'krishna' ? '🪈' : item.id === 'rama' ? '🏹' : item.id === 'buddha' ? '☸️' : '🕉️'}
               </Text>
            </View>
            <Text style={[styles.companionName, { color: item.themeColor }]}>{item.name}</Text>
          </BlurView>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose your Companion</Text>

      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={companionList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: ITEM_SPACING,
          }}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <BlurView intensity={80} tint="light" style={styles.buttonBlur}>
            <Text style={styles.confirmText}>Confirm</Text>
          </BlurView>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginTop: SPACING.xxl,
    textAlign: 'center',
  },
  carouselContainer: {
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: ITEM_WIDTH * 0.9,
    height: ITEM_WIDTH * 1.1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
  },
  cardBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  avatarPlaceholder: {
    width: ITEM_WIDTH * 0.5,
    height: ITEM_WIDTH * 0.5,
    borderRadius: ITEM_WIDTH * 0.25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarEmoji: {
    fontSize: 64,
  },
  companionName: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
  },
  footer: {
    marginBottom: SPACING.xxl,
    width: '100%',
    paddingHorizontal: SPACING.xl,
  },
  confirmButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    ...TYPOGRAPHY.body,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.background, // Dark text on light golden blur
  },
});

export default AvatarSelectScreen;
