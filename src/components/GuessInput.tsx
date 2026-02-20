import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from '../utils/haptics';
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
  const [warningText, setWarningText] = useState('');
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const warningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentGuess(Array(digits).fill(''));
    setActiveIndex(0);
  }, [digits]);

  useEffect(() => {
    return () => {
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
    };
  }, []);

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
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
      setWarningText('Sayı 0 ile başlayamaz');
      warningTimeout.current = setTimeout(() => setWarningText(''), 3000);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(guess);
    setCurrentGuess(Array(digits).fill(''));
    setActiveIndex(0);
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Sil', '0', 'Tahmin'];

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

      {warningText !== '' && (
        <Text style={styles.warningText}>{warningText}</Text>
      )}

      <View style={styles.numpad}>
        {numpadKeys.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.numpadKey,
              key === 'Sil' && styles.deleteKey,
              key === 'Tahmin' && styles.submitKey,
            ]}
            onPress={() => {
              if (key === 'Sil') handleDelete();
              else if (key === 'Tahmin') handleSubmit();
              else handleDigitPress(key);
            }}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text
              style={[
                styles.numpadKeyText,
                key === 'Sil' && styles.deleteKeyText,
                key === 'Tahmin' && styles.submitKeyText,
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
    gap: 6,
    marginBottom: spacing.sm,
  },
  inputBox: {
    width: 46,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 10,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  warningText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 270,
    gap: 5,
  },
  numpadKey: {
    width: 80,
    height: 50,
    backgroundColor: colors.card,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadKeyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  deleteKey: {
    backgroundColor: colors.surface,
  },
  deleteKeyText: {
    fontSize: 14,
    color: colors.error,
  },
  submitKey: {
    backgroundColor: colors.secondary,
  },
  submitKeyText: {
    fontSize: 14,
    color: colors.background,
  },
});
