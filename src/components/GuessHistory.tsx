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
                <Text style={styles.resultLabel}>Yanlış Yer</Text>
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
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 5,
    paddingHorizontal: 8,
    marginBottom: 3,
  },
  latestGuessRow: {
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  indexContainer: {
    width: 24,
  },
  indexText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  guessContainer: {
    flex: 1,
  },
  guessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 6,
  },
  digitRow: {
    flexDirection: 'row',
    gap: 3,
  },
  digitBox: {
    width: 28,
    height: 30,
    borderRadius: 6,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultContainer: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
    marginLeft: 6,
  },
  resultItem: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 36,
  },
  resultLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    lineHeight: 10,
  },
  bullText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.bull,
    lineHeight: 18,
  },
  cowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.cow,
    lineHeight: 18,
  },
});
