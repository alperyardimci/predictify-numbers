import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Hane Seçin</Text>
      <View style={styles.buttonsContainer}>
        {digits.map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.button}
            onPress={() => onSelect(digit)}
            activeOpacity={0.7}
          >
            <Text style={styles.digitText}>{digit}</Text>
            <Text style={styles.labelText}>Hane</Text>
            {bestRecords[digit] && (
              <View style={styles.recordContainer}>
                <Text style={styles.recordText}>
                  En iyi: {bestRecords[digit]!.moves} hamle
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  button: {
    width: 140,
    height: 140,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  digitText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  labelText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  recordContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  recordText: {
    fontSize: 12,
    color: colors.secondary,
  },
});
