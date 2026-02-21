import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { alert } from '../utils/alert';
import * as Haptics from '../utils/haptics';
import { Timer } from '../components/Timer';
import { GuessInput } from '../components/GuessInput';
import { GuessHistory } from '../components/GuessHistory';
import { ResultModal } from '../components/ResultModal';
import { useGame } from '../context/GameContext';
import { checkGuess, generateNumber } from '../utils/gameLogic';
import { saveRecord } from '../utils/storage';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type GameRouteProp = RouteProp<RootStackParamList, 'Game'>;

export function GameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GameRouteProp>();
  const { state, dispatch } = useGame();
  const [showResult, setShowResult] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [assistedMode, setAssistedMode] = useState(false);

  useEffect(() => {
    // If navigated with different digits, start new game
    if (route.params?.digits && route.params.digits !== state.digits) {
      const secretNumber = generateNumber(route.params.digits);
      dispatch({
        type: 'START_GAME',
        digits: route.params.digits,
        secretNumber,
      });
    }
  }, [route.params?.digits]);

  const handleSubmitGuess = async (guess: string) => {
    const result = checkGuess(state.secretNumber, guess);

    dispatch({
      type: 'MAKE_GUESS',
      guess: {
        value: guess,
        bulls: result.bulls,
        cows: result.cows,
        repeats: result.repeats,
      },
    });

    // Check if won
    if (result.bulls === state.digits) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch({ type: 'WIN_GAME' });

      const timeSeconds = Math.floor((Date.now() - state.startTime) / 1000);
      setFinalTime(timeSeconds);

      // Save record
      await saveRecord({
        id: Date.now().toString(),
        digits: state.digits,
        moves: state.moveCount + 1,
        timeSeconds,
        date: new Date().toISOString(),
      });

      setShowResult(true);
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    const secretNumber = generateNumber(state.digits);
    dispatch({ type: 'START_GAME', digits: state.digits, secretNumber });
  };

  const confirmAndGoHome = () => {
    setShowResult(false);
    dispatch({ type: 'RESET_GAME' });
    navigation.navigate('Home');
  };

  const handleGoHome = () => {
    if (state.gameStatus === 'playing' && state.moveCount > 0) {
      alert(
        'Oyundan Çık',
        'Oyun ilerlemeniz kaybolacak. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çık', style: 'destructive', onPress: confirmAndGoHome },
        ],
      );
    } else {
      confirmAndGoHome();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Çık</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{state.digits} Haneli Sayı</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.infoRow}>
        <Timer
          startTime={state.startTime}
          isRunning={state.gameStatus === 'playing'}
          moveCount={state.moveCount}
        />
        <View style={styles.infoSpacer} />
        <Text style={styles.toggleLabel}>Yardımlı</Text>
        <Switch
          value={assistedMode}
          onValueChange={setAssistedMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
          style={styles.toggleSwitch}
        />
      </View>

      <View style={styles.inputSection}>
        <GuessInput
          digits={state.digits}
          onSubmit={handleSubmitGuess}
          disabled={state.gameStatus === 'won'}
        />
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Tahmin Geçmişi</Text>
        <GuessHistory
          guesses={state.guesses}
          digits={state.digits}
          assistedMode={assistedMode}
          secretNumber={state.secretNumber}
        />
      </View>

      <ResultModal
        visible={showResult}
        secretNumber={state.secretNumber}
        moves={state.moveCount}
        timeSeconds={finalTime}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  infoSpacer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 6,
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  inputSection: {
    marginTop: 6,
  },
  historySection: {
    flex: 1,
    marginTop: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    paddingLeft: 6,
  },
});
