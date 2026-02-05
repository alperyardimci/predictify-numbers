import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Guess } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';

interface GuessHistoryProps {
  guesses: Guess[];
  digits: number;
}

export function GuessHistory({ guesses, digits }: GuessHistoryProps) {
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
      {guesses.map((guess, index) => (
        <View key={index} style={styles.guessRow}>
          <View style={styles.indexContainer}>
            <Text style={styles.indexText}>#{guesses.length - index}</Text>
          </View>
          <View style={styles.guessContainer}>
            <Text style={styles.guessText}>{guess.value}</Text>
          </View>
          <View style={styles.resultContainer}>
            <View style={styles.resultItem}>
              <Text style={styles.bullText}>+{guess.bulls}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.cowText}>-{guess.cows}</Text>
            </View>
          </View>
        </View>
      ))}
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
  resultContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
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
