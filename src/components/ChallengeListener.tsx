import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { LeagueChallenge } from '../types/league';
import { auth } from '../services/firebase';
import {
  listenForChallenges,
  acceptChallenge,
  declineChallenge,
} from '../services/league';

interface Props {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}

export function ChallengeListener({ navigationRef }: Props) {
  const [incoming, setIncoming] = useState<LeagueChallenge | null>(null);
  const processedRef = useRef<Set<string>>(new Set());

  // Listen for incoming challenges globally using auth.currentUser
  useEffect(() => {
    const playerId = auth.currentUser?.uid;
    if (!playerId) return;

    const unsub = listenForChallenges(playerId, (challenge) => {
      // Skip if already processed
      if (processedRef.current.has(challenge.id)) return;
      processedRef.current.add(challenge.id);
      setIncoming(challenge);
    });

    return unsub;
  }, []);

  const handleAccept = async () => {
    if (!incoming) return;
    const challengeId = incoming.id;
    const leagueId = incoming.leagueId;
    setIncoming(null);

    try {
      const result = await acceptChallenge(challengeId);
      const nav = navigationRef.current;
      if (nav?.isReady()) {
        nav.navigate('OnlineGame', {
          gameId: result.gameId,
          mySlot: result.mySlot,
          leagueId,
        });
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Teklif kabul edilemedi.');
    }
  };

  const handleDecline = async () => {
    if (!incoming) return;
    const challengeId = incoming.id;
    setIncoming(null);
    await declineChallenge(challengeId).catch(() => {});
  };

  return (
    <Modal
      visible={!!incoming}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <Pressable style={styles.overlay} onPress={handleDecline}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Maç Teklifi!</Text>
          <Text style={styles.text}>
            {incoming?.fromName} seni maça davet ediyor
          </Text>
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.declineBtn, pressed && { opacity: 0.7 }]}
              onPress={handleDecline}
            >
              <Text style={styles.declineText}>Reddet</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.acceptBtn, pressed && { opacity: 0.7 }]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptText}>Kabul Et</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: colors.cow,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.cow,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.error + '50',
  },
  declineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  acceptBtn: {
    backgroundColor: colors.secondary,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
