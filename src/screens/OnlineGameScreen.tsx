import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList, Guess } from '../types';
import { PlayerSlot } from '../types/online';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { GuessInput } from '../components/GuessInput';
import { GuessHistory } from '../components/GuessHistory';
import { CoinFlipView } from '../components/CoinFlipView';
import { OnlineInfoBar } from '../components/OnlineInfoBar';
import { OnlineResultModal } from '../components/OnlineResultModal';
import { DisconnectBanner } from '../components/DisconnectBanner';
import * as Haptics from 'expo-haptics';
import { updateWinStreak } from '../utils/storage';

type ScreenRouteProp = RouteProp<RootStackParamList, 'OnlineGame'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnlineGame'>;

export function OnlineGameScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { gameId, mySlot } = route.params;

  const { state, pickCoinFlip, makeGuess, forfeit } = useOnlineGame(gameId, mySlot as PlayerSlot);

  const handleGuess = async (guess: string) => {
    if (!state.isMyTurn) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await makeGuess(guess);
  };

  const handleGoHome = () => {
    navigation.popToTop();
  };

  const handleQuit = () => {
    Alert.alert(
      'Pes Et',
      'Oyundan çekilmek istediğine emin misin? Rakip kazanacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Pes Et',
          style: 'destructive',
          onPress: () => forfeit(),
        },
      ]
    );
  };

  // Update win streak when game finishes
  const streakUpdated = useRef(false);
  useEffect(() => {
    if (state.phase === 'finished' && state.room?.result?.winner && !streakUpdated.current) {
      streakUpdated.current = true;
      const won = state.room.result.winner === mySlot;
      updateWinStreak(won);
    }
  }, [state.phase, state.room?.result?.winner, mySlot]);

  // Loading state
  if (state.phase === 'loading' || !state.room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text style={styles.loadingText}>Oyun yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Coin flip phases
  if (state.phase === 'coin_flip' || state.phase === 'picking' || state.phase === 'coin_result') {
    return (
      <SafeAreaView style={styles.container}>
        <CoinFlipView
          onPick={pickCoinFlip}
          myPick={state.coinFlipPick}
          phase={state.phase}
          coinFlipData={state.room.coinFlip}
          mySlot={mySlot as PlayerSlot}
        />
      </SafeAreaView>
    );
  }

  // Game phase
  const opponentSlot: PlayerSlot = mySlot === 'player1' ? 'player2' : 'player1';
  const opponentGuessesObj = state.room.guesses?.[opponentSlot] || {};
  const myGuessesObj = state.room.guesses?.[mySlot as PlayerSlot] || {};

  // Build combined chronological guess list
  const firstTurnSlot = state.room.coinFlip?.firstTurn;
  const iGoFirst = firstTurnSlot === (mySlot as PlayerSlot);

  const combinedGuesses: (Guess & { _sort: number })[] = [];

  Object.values(myGuessesObj).forEach((g: any) => {
    combinedGuesses.push({
      value: g.value,
      bulls: g.bulls,
      cows: g.cows,
      repeats: g.repeats,
      owner: 'me',
      _sort: iGoFirst ? g.index * 2 : g.index * 2 + 1,
    });
  });

  Object.values(opponentGuessesObj).forEach((g: any) => {
    combinedGuesses.push({
      value: g.value,
      bulls: g.bulls,
      cows: g.cows,
      repeats: g.repeats,
      owner: 'opponent',
      _sort: iGoFirst ? g.index * 2 + 1 : g.index * 2,
    });
  });

  combinedGuesses.sort((a, b) => b._sort - a._sort);
  const allGuesses: Guess[] = combinedGuesses.map(({ _sort, ...rest }) => rest);

  const isWinner = state.room.result?.winner === mySlot;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContent}>
        {state.disconnectCountdown !== null && state.disconnectCountdown > 0 && (
          <DisconnectBanner countdown={state.disconnectCountdown} />
        )}

        <OnlineInfoBar
          isMyTurn={state.isMyTurn}
          turnNumber={state.room.turns?.turnNumber || 1}
          turnTimeLeft={state.turnTimeLeft}
          onQuit={handleQuit}
        />

        <View style={styles.historyContainer}>
          <GuessHistory
            guesses={allGuesses}
            digits={6}
            assistedMode={!!state.room.assistedMode}
            secretNumber={state.room.secretNumber}
          />
        </View>

        {!state.isMyTurn && state.phase === 'playing' && (
          <View style={styles.waitingOverlay}>
            <Text style={styles.waitingText}>Rakibin sırası...</Text>
          </View>
        )}

        <GuessInput
          digits={6}
          onSubmit={handleGuess}
          disabled={!state.isMyTurn || state.phase !== 'playing'}
        />
      </View>

      <OnlineResultModal
        visible={state.phase === 'finished'}
        isWinner={isWinner}
        reason={state.room.result?.reason || null}
        winnerGuessCount={state.room.result?.winnerGuessCount || null}
        secretNumber={state.room.secretNumber || '??????'}
        onGoHome={handleGoHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  gameContent: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  historyContainer: {
    flex: 1,
  },
  waitingOverlay: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  waitingText: {
    fontSize: 15,
    color: colors.cow,
    fontWeight: '600',
  },
});
