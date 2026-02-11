import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../constants/theme';
import { PlayerSlot } from '../types/online';

interface CoinFlipViewProps {
  onPick: (digit: number) => void;
  myPick: number | null;
  phase: 'coin_flip' | 'picking' | 'coin_result';
  coinFlipData?: {
    systemDigit: number;
    player1Pick: number | null;
    player2Pick: number | null;
    firstTurn: PlayerSlot | null;
  };
  mySlot: PlayerSlot;
}

export function CoinFlipView({ onPick, myPick, phase, coinFlipData, mySlot }: CoinFlipViewProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handlePick = async (digit: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPick(digit);
  };

  if (phase === 'coin_result' && coinFlipData) {
    const iGoFirst = coinFlipData.firstTurn === mySlot;
    return (
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={styles.title}>Yazı-Tura Sonucu</Text>
        <View style={styles.resultRow}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Sistem</Text>
            <View style={styles.resultDigitBox}>
              <Text style={styles.resultDigit}>{coinFlipData.systemDigit}</Text>
            </View>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Sen</Text>
            <View style={[styles.resultDigitBox, iGoFirst && styles.winnerBox]}>
              <Text style={styles.resultDigit}>
                {mySlot === 'player1' ? coinFlipData.player1Pick : coinFlipData.player2Pick}
              </Text>
            </View>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Rakip</Text>
            <View style={[styles.resultDigitBox, !iGoFirst && styles.winnerBox]}>
              <Text style={styles.resultDigit}>
                {mySlot === 'player1' ? coinFlipData.player2Pick : coinFlipData.player1Pick}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.resultText, iGoFirst ? styles.greenText : styles.orangeText]}>
          {iGoFirst ? 'Sen başlıyorsun!' : 'Rakip başlıyor!'}
        </Text>
      </Animated.View>
    );
  }

  if (phase === 'picking') {
    return (
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={styles.title}>Yazı-Tura</Text>
        <Text style={styles.subtitle}>Seçimin: {myPick}</Text>
        <Text style={styles.waitingText}>Rakibin seçimi bekleniyor...</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={styles.title}>Yazı-Tura</Text>
      <Text style={styles.subtitle}>
        0-9 arası bir rakam seç.{'\n'}
        Sistem de bir rakam tuttu. En yakın olan başlar!
      </Text>

      <View style={styles.digitGrid}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.digitButton}
            onPress={() => handlePick(digit)}
            activeOpacity={0.7}
          >
            <Text style={styles.digitText}>{digit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  digitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
    gap: 10,
  },
  digitButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  digitText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  waitingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginVertical: spacing.lg,
  },
  resultItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultDigitBox: {
    width: 56,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  winnerBox: {
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  resultDigit: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  greenText: {
    color: colors.secondary,
  },
  orangeText: {
    color: colors.cow,
  },
});
