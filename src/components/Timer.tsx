import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { formatTime } from '../utils/gameLogic';

interface TimerProps {
  startTime: number;
  isRunning: boolean;
  moveCount: number;
}

export function Timer({ startTime, isRunning, moveCount }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || startTime === 0) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const seconds = Math.floor((now - startTime) / 1000);
      setElapsed(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>Süre</Text>
        <Text style={styles.value}>{formatTime(elapsed)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Text style={styles.label}>Hamle</Text>
        <Text style={styles.value}>{moveCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
});
