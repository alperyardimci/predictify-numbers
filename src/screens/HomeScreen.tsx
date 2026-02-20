import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DigitSelector } from '../components/DigitSelector';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useGame } from '../context/GameContext';
import { generateNumber } from '../utils/gameLogic';
import { getWinStreak } from '../utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { dispatch } = useGame();
  const [showHowTo, setShowHowTo] = useState(false);
  const [winStreak, setWinStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getWinStreak().then(setWinStreak);
    }, [])
  );

  const handleSelectDigits = (digits: number) => {
    const secretNumber = generateNumber(digits);
    dispatch({ type: 'START_GAME', digits, secretNumber });
    navigation.navigate('Game', { digits });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Predictify</Text>
          <Text style={styles.brandSub}>Numbers</Text>
        </View>

        {/* Solo Mode Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Tek Kişilik</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Bilgisayara karşı oyna. Hane seçerek başla.
          </Text>
          <DigitSelector onSelect={handleSelectDigits} />
        </View>

        {/* Online Mode Card */}
        <View style={[styles.sectionCard, styles.onlineCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, styles.onlineDot]} />
            <Text style={[styles.sectionTitle, styles.onlineTitle]}>Online Mod</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Gerçek rakibe karşı 6 haneli sayıyı bul.
          </Text>
          {winStreak > 0 && (
            <View style={styles.streakRow}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{winStreak}</Text>
              <Text style={styles.streakLabel}>galibiyet serisi</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.onlineButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => navigation.navigate('OnlineLobby')}
          >
            <Text style={styles.onlineButtonText}>Rakip Bul</Text>
          </Pressable>
        </View>

        {/* Leagues Card */}
        <View style={[styles.sectionCard, styles.leagueCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, styles.leagueDot]} />
            <Text style={[styles.sectionTitle, styles.leagueTitle]}>Ligler</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Lig kur, arkadaşlarını davet et, sıralamada yarış.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.leagueButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => navigation.navigate('League')}
          >
            <Text style={styles.leagueButtonText}>Liglere Git</Text>
          </Pressable>
        </View>

        {/* Hint Bar */}
        <View style={styles.hintBar}>
          <View style={styles.hintItem}>
            <Text style={styles.hintSymbol}>+</Text>
            <Text style={styles.hintLabel}>Doğru yer</Text>
          </View>
          <View style={styles.hintDivider} />
          <View style={styles.hintItem}>
            <Text style={[styles.hintSymbol, { color: colors.cow }]}>-</Text>
            <Text style={styles.hintLabel}>Yanlış yer</Text>
          </View>
          <View style={styles.hintDivider} />
          <View style={styles.hintItem}>
            <Text style={[styles.hintSymbol, { color: colors.repeat }]}>~</Text>
            <Text style={styles.hintLabel}>Tekrarlayan</Text>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomRow}>
          <Pressable
            style={({ pressed }) => [
              styles.bottomButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowHowTo(true)}
          >
            <Text style={styles.bottomButtonText}>Nasıl Oynanır?</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.bottomButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => navigation.navigate('Records')}
          >
            <Text style={styles.bottomButtonText}>Rekor Tablosu</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showHowTo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowTo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowHowTo(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Nasıl Oynanır?</Text>
            <Text style={styles.modalText}>
              Bilgisayar gizli bir sayı seçer. Amacınız bu sayıyı en az denemede bulmak.
            </Text>
            <Text style={styles.modalText}>
              Her tahminden sonra üç ipucu alırsınız:
            </Text>
            <Text style={styles.modalHint}>
              <Text style={styles.bullHighlight}>+1 Tam İsabet</Text>
              {' → Rakam doğru ve doğru yerde'}
            </Text>
            <Text style={styles.modalHint}>
              <Text style={styles.cowHighlight}>-1 Yanlış Yerde</Text>
              {' → Rakam var ama yeri yanlış'}
            </Text>
            <Text style={styles.modalHint}>
              <Text style={styles.repeatHighlight}>~1 Tekrarlayan</Text>
              {' → Rakam doğru yerde ama gizli sayıda tekrar ediyor'}
            </Text>
            <Text style={styles.modalText}>
              İpuçlarını kullanarak gizli sayıyı bulun!
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setShowHowTo(false)}
            >
              <Text style={styles.modalCloseText}>Anladım!</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.textSecondary,
    marginTop: -4,
    letterSpacing: 4,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineCard: {
    borderColor: colors.secondary + '40',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  onlineDot: {
    backgroundColor: colors.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  onlineTitle: {
    color: colors.secondary,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  streakFire: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.cow,
  },
  streakLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Leagues card
  leagueCard: {
    borderColor: colors.primary + '40',
  },
  leagueDot: {
    backgroundColor: colors.primary,
  },
  leagueTitle: {
    color: colors.primary,
  },
  leagueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  leagueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  // Online button
  onlineButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  onlineButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },

  // Hint Bar
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintItem: {
    flex: 1,
    alignItems: 'center',
  },
  hintSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.bull,
  },
  hintLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hintDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  // Bottom Buttons
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  modalHint: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  bullHighlight: {
    color: colors.bull,
    fontWeight: 'bold',
  },
  cowHighlight: {
    color: colors.cow,
    fontWeight: 'bold',
  },
  repeatHighlight: {
    color: colors.repeat,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
