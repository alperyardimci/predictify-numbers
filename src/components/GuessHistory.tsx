import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Guess } from '../types';
import { getDigitStatuses } from '../utils/gameLogic';
import { colors, spacing, borderRadius } from '../constants/theme';

interface GuessHistoryProps {
  guesses: Guess[];
  digits: number;
  assistedMode?: boolean;
  secretNumber?: string;
}

export function GuessHistory({ guesses, digits, assistedMode = false, secretNumber = '' }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Henüz tahmin yapılmadı</Text>
        <Text style={styles.emptySubtext}>
          {digits} haneli sayıyı tahmin edin
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {guesses.map((guess, index) => {
        const isLatest = index === 0;
        const digitStatuses = assistedMode && secretNumber
          ? getDigitStatuses(secretNumber, guess.value)
          : null;

        return (
          <View
            key={index}
            style={[
              styles.guessRow,
              isLatest && styles.latestGuessRow,
            ]}
          >
            <View style={styles.indexContainer}>
              <Text style={styles.indexText}>#{guesses.length - index}</Text>
            </View>
            <View style={styles.guessContainer}>
              {assistedMode && digitStatuses ? (
                <View style={styles.digitRow}>
                  {guess.value.split('').map((digit, dIndex) => (
                    <View
                      key={dIndex}
                      style={[
                        styles.digitBox,
                        digitStatuses[dIndex] === 'bull' && styles.digitBull,
                        digitStatuses[dIndex] === 'cow' && styles.digitCow,
                        digitStatuses[dIndex] === 'miss' && styles.digitMiss,
                      ]}
                    >
                      <Text style={styles.digitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.guessText}>{guess.value}</Text>
              )}
            </View>
            <View style={styles.resultContainer}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Tam İsabet</Text>
                <Text style={styles.bullText}>+{guess.bulls}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Yanlış Yerde</Text>
                <Text style={styles.cowText}>-{guess.cows}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  latestGuessRow: {
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  indexContainer: {
    width: 40,
  },
  indexText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  guessContainer: {
    flex: 1,
  },
  guessText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 8,
  },
  digitRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  digitBox: {
    width: 36,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBull: {
    backgroundColor: colors.bull,
  },
  digitCow: {
    backgroundColor: colors.cow,
  },
  digitMiss: {
    backgroundColor: colors.border,
  },
  digitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bullText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.bull,
  },
  cowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cow,
  },
});
