import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';
import { formatTime } from '../utils/gameLogic';

interface ResultModalProps {
  visible: boolean;
  secretNumber: string;
  moves: number;
  timeSeconds: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function ResultModal({
  visible,
  secretNumber,
  moves,
  timeSeconds,
  onPlayAgain,
  onGoHome,
}: ResultModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(Math.random() * 300 - 150),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Modal scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Confetti animation
      confettiAnims.forEach((anim, index) => {
        const delay = index * 50;
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: 600,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: Math.random() * 10,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.translateY.setValue(-100);
        anim.opacity.setValue(1);
      });
    }
  }, [visible]);

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD700'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                left: `${(index * 5) % 100}%`,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 10],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.modal,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Tebrikler!</Text>
          <Text style={styles.subtitle}>Sayıyı buldunuz</Text>

          <View style={styles.numberContainer}>
            <Text style={styles.number}>{secretNumber}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Hamle</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
              <Text style={styles.statLabel}>Süre</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={onPlayAgain}
              activeOpacity={0.7}
            >
              <Text style={styles.playAgainText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={onGoHome}
              activeOpacity={0.7}
            >
              <Text style={styles.homeText}>Ana Sayfa</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 2,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  numberContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  number: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  playAgainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  homeButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  homeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});
