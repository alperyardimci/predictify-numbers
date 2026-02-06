import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
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
  const [showHowTo, setShowHowTo] = React.useState(false);

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

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.howToButton}
            onPress={() => setShowHowTo(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.howToButtonText}>Nasıl Oynanır?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recordsButton}
            onPress={() => navigation.navigate('Records')}
            activeOpacity={0.7}
          >
            <Text style={styles.recordsButtonText}>Rekor Tablosu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showHowTo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowTo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nasıl Oynanır?</Text>
            <Text style={styles.modalText}>
              Bilgisayar gizli bir sayı seçer. Amacınız bu sayıyı en az denemede bulmak.
            </Text>
            <Text style={styles.modalText}>
              Her tahminden sonra iki ipucu alırsınız:
            </Text>
            <Text style={styles.modalHint}>
              <Text style={styles.bullHighlight}>+1 Tam İsabet</Text>
              {' → Rakam doğru ve doğru yerde'}
            </Text>
            <Text style={styles.modalHint}>
              <Text style={styles.cowHighlight}>-1 Yanlış Yerde</Text>
              {' → Rakam var ama yeri yanlış'}
            </Text>
            <Text style={styles.modalText}>
              İpuçlarını kullanarak gizli sayıyı bulun!
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHowTo(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>Anladım!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  bottomButtons: {
    gap: spacing.sm,
  },
  howToButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  howToButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
