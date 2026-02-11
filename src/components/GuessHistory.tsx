import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Guess } from '../types';
import { getDigitStatuses } from '../utils/gameLogic';
import { colors, spacing } from '../constants/theme';

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
    <FlatList
      style={styles.container}
      data={guesses}
      keyExtractor={(_, index) => index.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: guess, index }) => {
        const isLatest = index === 0;
        const hasOwner = !!guess.owner;
        const digitStatuses = assistedMode && secretNumber
          ? getDigitStatuses(secretNumber, guess.value)
          : null;

        return (
          <View
            style={[
              styles.guessRow,
              isLatest && !hasOwner && styles.latestGuessRow,
              hasOwner && guess.owner === 'me' && styles.myGuessRow,
              hasOwner && guess.owner === 'opponent' && styles.opponentGuessRow,
            ]}
          >
            <View style={styles.indexContainer}>
              {hasOwner && (
                <Text style={[
                  styles.ownerBadge,
                  guess.owner === 'me' ? styles.myBadge : styles.opponentBadge,
                ]}>
                  {guess.owner === 'me' ? 'S' : 'R'}
                </Text>
              )}
              <Text style={styles.indexText}>#{guesses.length - index}</Text>
            </View>
            <View style={styles.guessContainer}>
              {assistedMode && digitStatuses ? (
                <View style={styles.digitRow}>
                  {guess.value.split('').map((digit, dIndex) => {
                    const status = digitStatuses[dIndex];
                    if (status === 'bull-repeat' || status === 'cow-repeat') {
                      return (
                        <View key={dIndex} style={[
                          styles.digitBox,
                          status === 'bull-repeat' ? styles.digitBullRepeat : styles.digitCowRepeat,
                        ]}>
                          <View style={styles.diagonalOverlay} />
                          <Text style={[styles.digitText, styles.digitTextOverlay]}>{digit}</Text>
                        </View>
                      );
                    }
                    return (
                      <View
                        key={dIndex}
                        style={[
                          styles.digitBox,
                          status === 'bull' && styles.digitBull,
                          status === 'cow' && styles.digitCow,
                          status === 'miss' && styles.digitMiss,
                        ]}
                      >
                        <Text style={styles.digitText}>{digit}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.guessText}>{guess.value}</Text>
              )}
            </View>
            <View style={styles.resultContainer}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>İsabet</Text>
                <Text style={styles.bullText}>+{guess.bulls}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Yer</Text>
                <Text style={styles.cowText}>-{guess.cows}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Tekrar</Text>
                <Text style={styles.repeatText}>~{guess.repeats}</Text>
              </View>
            </View>
          </View>
        );
      }}
    />
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
    width: 28,
    alignItems: 'center',
  },
  ownerBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  myBadge: {
    color: colors.primary,
  },
  opponentBadge: {
    color: colors.error,
  },
  myGuessRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  opponentGuessRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
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
  digitBullRepeat: {
    backgroundColor: colors.bull,
    overflow: 'hidden',
  },
  digitCowRepeat: {
    backgroundColor: colors.cow,
    overflow: 'hidden',
  },
  diagonalOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: colors.repeat,
    transform: [{ rotate: '45deg' }],
    top: -19,
    left: 9,
  },
  digitTextOverlay: {
    position: 'absolute',
  },
  digitText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultContainer: {
    flexDirection: 'row',
    gap: 3,
    flexShrink: 0,
    marginLeft: 4,
  },
  resultItem: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 30,
  },
  resultLabel: {
    fontSize: 7,
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
  repeatText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.repeat,
    lineHeight: 18,
  },
});
