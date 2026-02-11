import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useMatchmaking } from '../hooks/useMatchmaking';
import * as Haptics from 'expo-haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnlineLobby'>;

export function OnlineLobbyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { status, match, error, startSearching, cancelSearching } = useMatchmaking();
  const [assistedMode, setAssistedMode] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'searching') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
  }, [status, pulseAnim, rotateAnim]);

  useEffect(() => {
    if (status === 'found' && match) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => {
        navigation.replace('OnlineGame', {
          gameId: match.gameId,
          mySlot: match.mySlot,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, match, navigation]);

  const handleFindOpponent = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSearching(assistedMode);
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelSearching();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Online Mod</Text>
        <Text style={styles.subtitle}>6 haneli gizli sayıyı rakibinden önce bul!</Text>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Kurallar</Text>
          <Text style={styles.ruleText}>1. Yazı-tura ile başlayan belirlenir</Text>
          <Text style={styles.ruleText}>2. Sırayla tahmin edilir</Text>
          <Text style={styles.ruleText}>3. İlk 6 isabet yapan kazanır</Text>
          <Text style={styles.ruleText}>4. 30sn bağlantı koparsa rakip kazanır</Text>
        </View>

        {status === 'idle' && (
          <>
            <View style={styles.modeToggle}>
              <Pressable
                style={[styles.modeOption, !assistedMode && styles.modeOptionActive]}
                onPress={() => setAssistedMode(false)}
              >
                <Text style={[styles.modeOptionText, !assistedMode && styles.modeOptionTextActive]}>
                  Yardımsız
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeOption, assistedMode && styles.modeOptionActive]}
                onPress={() => setAssistedMode(true)}
              >
                <Text style={[styles.modeOptionText, assistedMode && styles.modeOptionTextActive]}>
                  Yardımlı
                </Text>
              </Pressable>
            </View>
            <Text style={styles.modeDesc}>
              {assistedMode
                ? 'Tahmin sonrası haneler renkli gösterilir'
                : 'Sadece isabet/yer/tekrar sayısı gösterilir'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.findButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleFindOpponent}
            >
              <Text style={styles.findButtonText}>Rakip Bul</Text>
            </Pressable>
          </>
        )}

        {status === 'searching' && (
          <View style={styles.searchingContainer}>
            <Animated.View
              style={[
                styles.searchingCircle,
                {
                  transform: [{ scale: pulseAnim }, { rotate: spin }],
                },
              ]}
            >
              <Text style={styles.searchingEmoji}>?</Text>
            </Animated.View>
            <Text style={styles.searchingText}>Rakip aranıyor...</Text>
            <ActivityIndicator color={colors.secondary} style={{ marginTop: spacing.sm }} />
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
          </View>
        )}

        {status === 'found' && (
          <View style={styles.foundContainer}>
            <Text style={styles.foundText}>Rakip bulundu!</Text>
            <ActivityIndicator color={colors.secondary} size="large" />
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.findButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleFindOpponent}
            >
              <Text style={styles.findButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  rulesBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ruleText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modeOptionActive: {
    backgroundColor: colors.primary,
  },
  modeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeOptionTextActive: {
    color: colors.text,
  },
  modeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  findButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  findButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.background,
  },
  searchingContainer: {
    alignItems: 'center',
  },
  searchingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchingEmoji: {
    fontSize: 32,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  searchingText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  foundContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  foundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
