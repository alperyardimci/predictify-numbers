import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../constants/theme';
import { getBestRecord } from '../utils/storage';
import { Record } from '../types';

interface DigitSelectorProps {
  onSelect: (digits: number) => void;
}

export function DigitSelector({ onSelect }: DigitSelectorProps) {
  const [bestRecords, setBestRecords] = useState<{ [key: number]: Record | null }>({});

  useFocusEffect(
    useCallback(() => {
      loadBestRecords();
    }, [])
  );

  const loadBestRecords = async () => {
    const records: { [key: number]: Record | null } = {};
    for (const digits of [2, 3, 4, 5]) {
      records[digits] = await getBestRecord(digits);
    }
    setBestRecords(records);
  };

  const digits = [2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {digits.map((digit) => (
        <Pressable
          key={digit}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onSelect(digit)}
        >
          <Text style={styles.digitText}>{digit}</Text>
          <Text style={styles.labelText}>Hane</Text>
          {bestRecords[digit] ? (
            <Text style={styles.recordText}>
              {bestRecords[digit]!.moves} hamle
            </Text>
          ) : (
            <Text style={styles.noRecord}>--</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  digitText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  labelText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordText: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  noRecord: {
    fontSize: 10,
    color: colors.border,
    marginTop: spacing.xs,
  },
});
