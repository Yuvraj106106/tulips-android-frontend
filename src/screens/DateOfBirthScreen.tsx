import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveSettings } from '../services/settings';

const { width } = Dimensions.get('window');
const DIAL_SIZE = width * 0.95;
const CENTER = DIAL_SIZE / 2;

// Ring Radii - concentric from outer to inner
const YEAR_RADIUS = DIAL_SIZE * 0.42;
const MONTH_RADIUS = DIAL_SIZE * 0.30;
const DAY_RADIUS = DIAL_SIZE * 0.18;

type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  DateOfBirth: undefined;
  Language: undefined;
  Permissions: undefined;
  AvatarSelect: undefined;
  PortalTransition: undefined;
  CinematicIntro: undefined;
  Chat: undefined;
};

type DateOfBirthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DateOfBirth'>;

interface Props {
  navigation: DateOfBirthScreenNavigationProp;
}

const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

const DateOfBirthScreen: React.FC<Props> = ({ navigation }) => {
  const currentYear = new Date().getFullYear();
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0); // 0-indexed
  const [year, setYear] = useState(currentYear - 20);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const [activeRing, setActiveRing] = useState<'day' | 'month' | 'year' | null>(null);

  // Clamps the current day so it can never land on a date that doesn't
  // exist (e.g. Feb 30) after month/year changes.
  const clampDay = (d: number, m: number, y: number) => Math.min(d, daysInMonth(m, y));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const dx = locationX - CENTER;
        const dy = locationY - CENTER;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > YEAR_RADIUS - 30 && dist < YEAR_RADIUS + 30) setActiveRing('year');
        else if (dist > MONTH_RADIUS - 30 && dist < MONTH_RADIUS + 30) setActiveRing('month');
        else if (dist > DAY_RADIUS - 30 && dist < DAY_RADIUS + 30) setActiveRing('day');
        else setActiveRing(null);
      },
      onPanResponderMove: (evt) => {
        if (!activeRing) return;

        const { locationX, locationY } = evt.nativeEvent;
        const dx = locationX - CENTER;
        const dy = locationY - CENTER;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const normalizedAngle = (angle + 450) % 360; // Offset to start from top

        if (activeRing === 'year') {
          const yearRange = 100;
          const startYear = currentYear - 100;
          const newYear = startYear + Math.floor((normalizedAngle / 360) * yearRange);
          setYear(newYear);
          setDay((d) => clampDay(d, month, newYear));
        } else if (activeRing === 'month') {
          const newMonth = Math.min(11, Math.max(0, Math.floor((normalizedAngle / 360) * 12)));
          setMonth(newMonth);
          setDay((d) => clampDay(d, newMonth, year));
        } else if (activeRing === 'day') {
          const maxDay = daysInMonth(month, year);
          const newDay = Math.floor((normalizedAngle / 360) * maxDay) + 1;
          setDay(Math.min(maxDay, Math.max(1, newDay)));
        }
      },
      onPanResponderRelease: () => setActiveRing(null),
    })
  ).current;

  const handleConfirm = async () => {
    const dob = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await saveSettings({ dateOfBirth: dob });
    navigation.replace('Language');
  };

  const renderLotusPattern = (radius: number, petals: number, opacity: number) => {
    return [...Array(petals)].map((_, i) => {
      const angle = (i * (360 / petals)) * (Math.PI / 180);
      const cp1x = CENTER + (radius + 20) * Math.cos(angle - 0.2);
      const cp1y = CENTER + (radius + 20) * Math.sin(angle - 0.2);
      const cp2x = CENTER + (radius + 20) * Math.cos(angle + 0.2);
      const cp2y = CENTER + (radius + 20) * Math.sin(angle + 0.2);

      return (
        <Path
          key={`petal-${radius}-${i}`}
          d={`M ${CENTER} ${CENTER} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${CENTER} ${CENTER}`}
          stroke={COLORS.primary}
          strokeWidth="0.5"
          fill="transparent"
          opacity={opacity}
        />
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#050515']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Janma Tithi</Text>
        <Text style={styles.subtitle}>Touch and rotate the sacred wheels</Text>
      </View>

      <View style={styles.displayContainer}>
        <View style={styles.glassCard}>
          <Text style={styles.dateDisplay}>
            {String(day).padStart(2, '0')} {months[month]} {year}
          </Text>
        </View>
      </View>

      <View style={styles.dialContainer} {...panResponder.panHandlers}>
        <Svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}>
          <Defs>
            <SvgLinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#FFBF00" stopOpacity="0.2" />
            </SvgLinearGradient>
          </Defs>

          {/* Concentric Traditional Linework */}
          {renderLotusPattern(YEAR_RADIUS, 12, 0.1)}
          {renderLotusPattern(MONTH_RADIUS, 8, 0.15)}

          {/* Year Wheel */}
          <Circle cx={CENTER} cy={CENTER} r={YEAR_RADIUS} stroke={activeRing === 'year' ? COLORS.primary : COLORS.border} strokeWidth={activeRing === 'year' ? 3 : 0.5} fill="transparent" opacity={0.4} />
          {[...Array(20)].map((_, i) => {
            const angle = (i * 18 - 90) * (Math.PI / 180);
            const x = CENTER + YEAR_RADIUS * Math.cos(angle);
            const y = CENTER + YEAR_RADIUS * Math.sin(angle);
            return <Circle key={`y-tick-${i}`} cx={x} cy={y} r="1.5" fill={COLORS.primary} opacity={0.3} />;
          })}

          {/* Month Wheel */}
          <Circle cx={CENTER} cy={CENTER} r={MONTH_RADIUS} stroke={activeRing === 'month' ? COLORS.primary : COLORS.border} strokeWidth={activeRing === 'month' ? 3 : 0.5} fill="transparent" opacity={0.4} />
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = CENTER + MONTH_RADIUS * Math.cos(angle);
            const y = CENTER + MONTH_RADIUS * Math.sin(angle);
            return <Circle key={`m-tick-${i}`} cx={x} cy={y} r="2" fill={COLORS.primary} opacity={0.4} />;
          })}

          {/* Day Wheel */}
          <Circle cx={CENTER} cy={CENTER} r={DAY_RADIUS} stroke={activeRing === 'day' ? COLORS.primary : COLORS.border} strokeWidth={activeRing === 'day' ? 3 : 0.5} fill="transparent" opacity={0.4} />
          {[...Array(daysInMonth(month, year))].map((_, i) => {
            const total = daysInMonth(month, year);
            const angle = (i * (360 / total) - 90) * (Math.PI / 180);
            const x = CENTER + DAY_RADIUS * Math.cos(angle);
            const y = CENTER + DAY_RADIUS * Math.sin(angle);
            return <Circle key={`d-tick-${i}`} cx={x} cy={y} r="1" fill={COLORS.primary} opacity={0.5} />;
          })}

          {/* Selection Beads */}
          <G transform={`rotate(${(year - (currentYear - 100)) / 100 * 360}, ${CENTER}, ${CENTER})`}>
            <Circle cx={CENTER} cy={CENTER - YEAR_RADIUS} r="10" fill={COLORS.primary} />
            <Circle cx={CENTER} cy={CENTER - YEAR_RADIUS} r="12" stroke={COLORS.primary} strokeWidth="1" fill="transparent" opacity={0.5} />
          </G>
          <G transform={`rotate(${month / 12 * 360}, ${CENTER}, ${CENTER})`}>
            <Circle cx={CENTER} cy={CENTER - MONTH_RADIUS} r="8" fill={COLORS.primary} />
            <Circle cx={CENTER} cy={CENTER - MONTH_RADIUS} r="10" stroke={COLORS.primary} strokeWidth="1" fill="transparent" opacity={0.5} />
          </G>
          <G transform={`rotate(${(day - 1) / daysInMonth(month, year) * 360}, ${CENTER}, ${CENTER})`}>
            <Circle cx={CENTER} cy={CENTER - DAY_RADIUS} r="6" fill={COLORS.primary} />
            <Circle cx={CENTER} cy={CENTER - DAY_RADIUS} r="8" stroke={COLORS.primary} strokeWidth="1" fill="transparent" opacity={0.5} />
          </G>
        </Svg>

        <View style={styles.centerLabels}>
          <Text style={styles.beadLabel}>{activeRing ? activeRing.toUpperCase() : 'WHEELS'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Nishchit Karein</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    letterSpacing: 6,
    fontWeight: '300',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    opacity: 0.5,
    letterSpacing: 1,
  },
  displayContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  glassCard: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 191, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.1)',
  },
  dateDisplay: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 3,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerLabels: {
    position: 'absolute',
    alignItems: 'center',
  },
  beadLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 4,
    opacity: 0.6,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  confirmButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 2,
  },
});

export default DateOfBirthScreen;
