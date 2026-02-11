import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

interface OnlineInfoBarProps {
  isMyTurn: boolean;
  turnNumber: number;
  turnTimeLeft: number | null;
  onQuit: () => void;
}

export function OnlineInfoBar({
  isMyTurn,
  turnNumber,
  turnTimeLeft,
  onQuit,
}: OnlineInfoBarProps) {
  const flashAnim = useRef(new Animated.Value(1)).current;
  const flashRef = useRef<Animated.CompositeAnimation | null>(null);
  const isCritical = turnTimeLeft !== null && turnTimeLeft <= 10;

  useEffect(() => {
    if (isCritical) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      flashRef.current = anim;
      anim.start();
    } else {
      if (flashRef.current) {
        flashRef.current.stop();
        flashRef.current = null;
      }
      flashAnim.setValue(1);
    }

    return () => {
      if (flashRef.current) {
        flashRef.current.stop();
      }
    };
  }, [isCritical]);

  return (
    <View style={styles.container}>
      <View style={styles.turnIndicator}>
        <View style={[styles.turnDot, isMyTurn ? styles.myTurnDot : styles.opponentTurnDot]} />
        <Text style={[styles.turnText, isMyTurn ? styles.myTurnText : styles.opponentTurnText]}>
          {isMyTurn ? 'Senin sıran' : 'Rakibin sırası'}
        </Text>
      </View>

      {turnTimeLeft !== null && (
        <Animated.View style={[styles.timerContainer, { opacity: isCritical ? flashAnim : 1 }]}>
          <Text style={[styles.timerText, isCritical && styles.timerCritical]}>
            {turnTimeLeft}s
          </Text>
        </Animated.View>
      )}

      <Pressable
        style={({ pressed }) => [styles.quitButton, pressed && { opacity: 0.6 }]}
        onPress={onQuit}
      >
        <Text style={styles.quitText}>Pes Et</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  turnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  myTurnDot: {
    backgroundColor: colors.secondary,
  },
  opponentTurnDot: {
    backgroundColor: colors.cow,
  },
  turnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  myTurnText: {
    color: colors.secondary,
  },
  opponentTurnText: {
    color: colors.cow,
  },
  timerContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginHorizontal: spacing.sm,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  timerCritical: {
    color: colors.error,
  },
  quitButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  quitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
