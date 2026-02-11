import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../constants/theme';

interface OnlineResultModalProps {
  visible: boolean;
  isWinner: boolean;
  reason: 'guessed' | 'disconnect' | 'forfeit' | null;
  winnerGuessCount: number | null;
  secretNumber: string;
  onGoHome: () => void;
}

export function OnlineResultModal({
  visible,
  isWinner,
  reason,
  winnerGuessCount,
  secretNumber,
  onGoHome,
}: OnlineResultModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

      if (isWinner) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [visible, isWinner, scaleAnim]);

  const getTitle = () => {
    if (isWinner) {
      if (reason === 'disconnect') return 'Rakip Ayrıldı';
      if (reason === 'forfeit') return 'Rakip Pes Etti';
      return 'Kazandın!';
    }
    if (reason === 'disconnect') return 'Bağlantı Kesildi';
    if (reason === 'forfeit') return 'Pes Ettin';
    return 'Kaybettin';
  };

  const getMessage = () => {
    if (isWinner) {
      if (reason === 'disconnect') return 'Rakibin bağlantısı kesildi.';
      if (reason === 'forfeit') return 'Rakip pes etti!';
      return `${winnerGuessCount} tahminde bildin!`;
    }
    if (reason === 'disconnect') return 'Bağlantın kesildi.';
    if (reason === 'forfeit') return 'Oyundan çekildin.';
    return `Rakip ${winnerGuessCount} tahminde bildi.`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.emoji}>{isWinner ? 'V' : 'X'}</Text>
          <Text style={[styles.title, isWinner ? styles.winTitle : styles.loseTitle]}>
            {getTitle()}
          </Text>
          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>Gizli Sayı</Text>
            <Text style={styles.secretNumber}>{secretNumber}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.homeButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onGoHome}
          >
            <Text style={styles.homeButtonText}>Ana Sayfa</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  winTitle: {
    color: colors.secondary,
  },
  loseTitle: {
    color: colors.error,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  secretBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  secretLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  secretNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 8,
  },
  homeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
