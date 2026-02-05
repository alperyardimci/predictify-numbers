import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../constants/theme';

interface GuessInputProps {
  digits: number;
  onSubmit: (guess: string) => void;
  disabled: boolean;
}

export function GuessInput({ digits, onSubmit, disabled }: GuessInputProps) {
  const [currentGuess, setCurrentGuess] = useState<string[]>(
    Array(digits).fill('')
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCurrentGuess(Array(digits).fill(''));
    setActiveIndex(0);
  }, [digits]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDigitPress = async (digit: string) => {
    if (disabled) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (activeIndex < digits) {
      const newGuess = [...currentGuess];
      newGuess[activeIndex] = digit;
      setCurrentGuess(newGuess);
      if (activeIndex < digits - 1) {
        setActiveIndex(activeIndex + 1);
      }
    }
  };

  const handleDelete = async () => {
    if (disabled) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (activeIndex > 0 || currentGuess[0] !== '') {
      const newGuess = [...currentGuess];
      if (currentGuess[activeIndex] === '' && activeIndex > 0) {
        newGuess[activeIndex - 1] = '';
        setActiveIndex(activeIndex - 1);
      } else {
        newGuess[activeIndex] = '';
      }
      setCurrentGuess(newGuess);
    }
  };

  const handleSubmit = async () => {
    if (disabled) return;

    const guess = currentGuess.join('');

    if (guess.length !== digits) {
      shake();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (guess[0] === '0') {
      shake();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(guess);
    setCurrentGuess(Array(digits).fill(''));
    setActiveIndex(0);
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'OK'];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX: shakeAnimation }] },
        ]}
      >
        {currentGuess.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.inputBox,
              index === activeIndex && styles.activeInputBox,
              digit !== '' && styles.filledInputBox,
            ]}
            onPress={() => !disabled && setActiveIndex(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.inputText}>{digit}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <View style={styles.numpad}>
        {numpadKeys.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.numpadKey,
              key === 'DEL' && styles.deleteKey,
              key === 'OK' && styles.submitKey,
            ]}
            onPress={() => {
              if (key === 'DEL') handleDelete();
              else if (key === 'OK') handleSubmit();
              else handleDigitPress(key);
            }}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text
              style={[
                styles.numpadKeyText,
                key === 'DEL' && styles.deleteKeyText,
                key === 'OK' && styles.submitKeyText,
              ]}
            >
              {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  inputBox: {
    width: 56,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  activeInputBox: {
    borderColor: colors.primary,
  },
  filledInputBox: {
    backgroundColor: colors.card,
  },
  inputText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
    gap: spacing.sm,
  },
  numpadKey: {
    width: 80,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadKeyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  deleteKey: {
    backgroundColor: colors.surface,
  },
  deleteKeyText: {
    fontSize: 18,
    color: colors.error,
  },
  submitKey: {
    backgroundColor: colors.secondary,
  },
  submitKeyText: {
    color: colors.background,
  },
});
