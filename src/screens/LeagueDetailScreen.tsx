import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { LeagueStanding, LeagueMatch } from '../types/league';
import { useLeagueDetail } from '../hooks/useLeagueDetail';
import { useMatchmaking } from '../hooks/useMatchmaking';
import {
  leaveLeague,
  sendChallenge,
  cancelChallenge,
  listenToChallenge,
} from '../services/league';

type ScreenRouteProp = RouteProp<RootStackParamList, 'LeagueDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeagueDetail'>;

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

export function LeagueDetailScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { leagueId } = route.params;

  const { league, standings, matches, myPlayerId, loading } = useLeagueDetail(leagueId);
  const { status: matchStatus, match, startSearching, cancelSearching } = useMatchmaking();

  // Sent challenge state
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [challengeTargetId, setChallengeTargetId] = useState<string | null>(null);
  const [challengeTargetName, setChallengeTargetName] = useState('');

  // Navigate to game when match found (random matchmaking)
  useEffect(() => {
    if (match) {
      navigation.replace('OnlineGame', {
        gameId: match.gameId,
        mySlot: match.mySlot,
        leagueId,
      });
    }
  }, [match, navigation, leagueId]);

  // Listen for sent challenge response
  useEffect(() => {
    if (!pendingChallengeId) return;
    const unsub = listenToChallenge(pendingChallengeId, (challenge) => {
      if (challenge.status === 'accepted' && challenge.gameId) {
        setPendingChallengeId(null);
        setChallengeTargetId(null);
        setChallengeTargetName('');
        navigation.replace('OnlineGame', {
          gameId: challenge.gameId,
          mySlot: 'player1',
          leagueId,
        });
      } else if (challenge.status === 'declined') {
        setPendingChallengeId(null);
        setChallengeTargetId(null);
        setChallengeTargetName('');
        Alert.alert('Reddedildi', 'Rakip maç teklifini reddetti.');
      }
    });
    return unsub;
  }, [pendingChallengeId, navigation, leagueId]);

  const handleCopyCode = async () => {
    if (league?.code) {
      await Clipboard.setStringAsync(league.code);
      Alert.alert('Kopyalandı', `Lig kodu "${league.code}" panoya kopyalandı.`);
    }
  };

  const handleFindMatch = () => {
    if (!league) return;
    startSearching(league.assistedMode, leagueId);
  };

  const handleLeaveLeague = () => {
    if (!myPlayerId || !league) return;
    Alert.alert(
      'Ligden Ayrıl',
      `"${league.name}" liginden ayrılmak istediğine emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveLeague(myPlayerId, leagueId);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Ligden ayrılınamadı.');
            }
          },
        },
      ]
    );
  };

  const handleChallenge = async (targetId: string, targetName: string) => {
    if (!myPlayerId || !league) return;

    const myStanding = standings.find((s) => s.playerId === myPlayerId);
    const myName = myStanding?.displayName || 'Oyuncu';

    Alert.alert(
      'Maç Teklifi',
      `${targetName} adlı oyuncuya maç teklif et?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Teklif Et',
          onPress: async () => {
            try {
              const cid = await sendChallenge(myPlayerId, targetId, myName, leagueId, league.assistedMode);
              setPendingChallengeId(cid);
              setChallengeTargetId(targetId);
              setChallengeTargetName(targetName);
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Teklif gönderilemedi.');
            }
          },
        },
      ]
    );
  };

  const handleCancelChallenge = async () => {
    if (!pendingChallengeId || !challengeTargetId) return;
    await cancelChallenge(pendingChallengeId, challengeTargetId).catch(() => {});
    setPendingChallengeId(null);
    setChallengeTargetId(null);
    setChallengeTargetName('');
  };

  if (loading || !league) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const renderStandingRow = (standing: LeagueStanding) => {
    const isMe = standing.playerId === myPlayerId;
    const totalMatches = standing.wins + standing.losses;
    const avgGuesses = standing.wins > 0
      ? (standing.totalGuessesInWins / standing.wins).toFixed(1)
      : '-';

    const rankDisplay =
      standing.rank === 1 ? '\u{1F947}' :
      standing.rank === 2 ? '\u{1F948}' :
      standing.rank === 3 ? '\u{1F949}' :
      String(standing.rank);

    return (
      <Pressable
        key={standing.playerId}
        style={[
          styles.row,
          isMe && styles.myRow,
        ]}
        onPress={() => {
          if (!isMe && !pendingChallengeId && matchStatus !== 'searching') {
            handleChallenge(standing.playerId, standing.displayName);
          }
        }}
        disabled={isMe || !!pendingChallengeId || matchStatus === 'searching'}
      >
        <Text style={[styles.cellRank, standing.rank <= 3 && styles.medalText]}>
          {rankDisplay}
        </Text>
        <Text style={[styles.cellName, isMe && styles.myText]} numberOfLines={1}>
          {standing.displayName}
        </Text>
        <Text style={styles.cellStat}>{standing.wins}</Text>
        <Text style={styles.cellStat}>{standing.losses}</Text>
        <Text style={styles.cellStat}>{avgGuesses}</Text>
        <Text style={[styles.cellRate, totalMatches > 0 && styles.rateHighlight]}>
          {totalMatches > 0 ? standing.winRate.toFixed(2) : '-'}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'← Geri'}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{league.name}</Text>
        <Pressable style={styles.leaveButton} onPress={handleLeaveLeague}>
          <Text style={styles.leaveButtonText}>Ayrıl</Text>
        </Pressable>
      </View>

      {/* League info */}
      <View style={styles.infoBar}>
        <Pressable style={styles.codeBadge} onPress={handleCopyCode}>
          <Text style={styles.codeLabel}>Kod:</Text>
          <Text style={styles.codeValue}>{league.code}</Text>
        </Pressable>
        <Text style={styles.infoText}>{league.memberCount} üye</Text>
        <View style={[styles.modeBadge, league.assistedMode && styles.modeBadgeAssisted]}>
          <Text style={styles.modeBadgeText}>
            {league.assistedMode ? 'Yardımlı' : 'Yardımsız'}
          </Text>
        </View>
      </View>

      {/* Standings table */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellRank]}>#</Text>
        <Text style={[styles.headerCell, styles.cellName]}>İsim</Text>
        <Text style={[styles.headerCell, styles.cellStat]}>G</Text>
        <Text style={[styles.headerCell, styles.cellStat]}>M</Text>
        <Text style={[styles.headerCell, styles.cellStat]}>Ort</Text>
        <Text style={[styles.headerCell, styles.cellRate]}>Oran</Text>
      </View>

      <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
        {standings.map(renderStandingRow)}
        {standings.length > 1 && (
          <Text style={styles.challengeHint}>Rakibe dokunarak maç teklif et</Text>
        )}

        {/* Recent matches */}
        {matches.length > 0 && (
          <View style={styles.matchesSection}>
            <Text style={styles.matchesSectionTitle}>Son Karşılaşmalar</Text>
            {matches.map((m) => (
              <View key={m.id} style={styles.matchRow}>
                <View style={styles.matchPlayers}>
                  <Text style={[
                    styles.matchWinner,
                    m.winnerId === myPlayerId && styles.matchMe,
                  ]} numberOfLines={1}>
                    {m.winnerName}
                  </Text>
                  <Text style={styles.matchVs}>vs</Text>
                  <Text style={[
                    styles.matchLoser,
                    m.loserId === myPlayerId && styles.matchMe,
                  ]} numberOfLines={1}>
                    {m.loserName}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  {m.reason === 'guessed' && m.winnerGuessCount ? (
                    <Text style={styles.matchDetail}>{m.winnerGuessCount} hamle</Text>
                  ) : (
                    <Text style={styles.matchDetail}>
                      {m.reason === 'disconnect' ? 'Bağlantı' : 'Pes'}
                    </Text>
                  )}
                  <Text style={styles.matchTime}>{formatTimeAgo(m.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom area */}
      <View style={styles.bottomArea}>
        {pendingChallengeId ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator color={colors.cow} size="small" />
            <Text style={styles.challengeWaitText}>{challengeTargetName} yanıt bekliyor...</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
              onPress={handleCancelChallenge}
            >
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </Pressable>
          </View>
        ) : matchStatus === 'searching' ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator color={colors.secondary} size="small" />
            <Text style={styles.searchingText}>Rakip aranıyor...</Text>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
              onPress={cancelSearching}
            >
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.matchButton, pressed && { opacity: 0.7 }]}
            onPress={handleFindMatch}
          >
            <Text style={styles.matchButtonText}>Rastgele Maç Bul</Text>
          </Pressable>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  leaveButton: {
    padding: spacing.sm,
  },
  leaveButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modeBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  modeBadgeAssisted: {
    backgroundColor: colors.primary + '30',
  },
  modeBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tableBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  myRow: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
    borderBottomColor: colors.primary + '30',
  },
  cellRank: {
    width: 40,
    textAlign: 'center',
    fontSize: 15,
    color: colors.text,
  },
  medalText: {
    fontSize: 18,
  },
  cellName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingRight: spacing.xs,
  },
  myText: {
    fontWeight: '700',
    color: colors.primary,
  },
  cellStat: {
    width: 36,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
  cellRate: {
    width: 46,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
  },
  rateHighlight: {
    color: colors.secondary,
    fontWeight: '700',
  },
  challengeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    opacity: 0.6,
  },

  // Recent matches
  matchesSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  matchWinner: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
    maxWidth: '40%',
  },
  matchLoser: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: '40%',
  },
  matchMe: {
    color: colors.primary,
  },
  matchVs: {
    fontSize: 11,
    color: colors.border,
    fontWeight: '600',
  },
  matchInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  matchDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  matchTime: {
    fontSize: 11,
    color: colors.border,
  },

  // Bottom
  bottomArea: {
    padding: spacing.md,
  },
  matchButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  matchButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  searchingText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  challengeWaitText: {
    fontSize: 15,
    color: colors.cow,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
});
