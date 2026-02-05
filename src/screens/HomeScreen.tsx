import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitSelector } from '../components/DigitSelector';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useGame } from '../context/GameContext';
import { generateNumber } from '../utils/gameLogic';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { dispatch } = useGame();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  useFocusEffect(
    useCallback(() => {
      forceUpdate();
    }, [])
  );

  const handleSelectDigits = (digits: number) => {
    const secretNumber = generateNumber(digits);
    dispatch({ type: 'START_GAME', digits, secretNumber });
    navigation.navigate('Game', { digits });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Predictify</Text>
          <Text style={styles.subtitle}>Numbers</Text>
          <Text style={styles.description}>
            Gizli sayıyı tahmin edin!{'\n'}
            +: Doğru yerde  -: Yanlış yerde
          </Text>
        </View>

        <DigitSelector onSelect={handleSelectDigits} />

        <TouchableOpacity
          style={styles.recordsButton}
          onPress={() => navigation.navigate('Records')}
          activeOpacity={0.7}
        >
          <Text style={styles.recordsButtonText}>Rekor Tablosu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.text,
    marginTop: -spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 24,
  },
  recordsButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordsButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
