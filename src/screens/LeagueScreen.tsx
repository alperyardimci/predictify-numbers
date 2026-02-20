import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, borderRadius } from '../constants/theme';
import { RootStackParamList } from '../types';
import { LeagueListItem } from '../types/league';
import { useLeagues } from '../hooks/useLeagues';
import { createLeague, joinLeague } from '../services/league';
import { getPlayerId } from '../services/playerIdentity';
import { getLastDisplayName, saveLastDisplayName } from '../utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'League'>;

const ACCENT_GOLD = '#FFD700';
const ACCENT_ORANGE = '#FF8C00';
const ACCENT_EMERALD = '#50C878';

export function LeagueScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { leagues, loading, reload } = useLeagues();

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createAssisted, setCreateAssisted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Join modal state
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [joining, setJoining] = useState(false);

  // Load cached display name
  useEffect(() => {
    getLastDisplayName().then((name) => {
      if (name) {
        setCreateDisplayName(name);
        setJoinDisplayName(name);
      }
    });
  }, []);

  const handleCreate = async () => {
    const trimmedName = createName.trim();
    const trimmedDisplay = createDisplayName.trim();
    if (!trimmedName || !trimmedDisplay) {
      Alert.alert('Hata', 'Lig adı ve takma ad gerekli.');
      return;
    }
    try {
      setCreating(true);
      const playerId = getPlayerId();
      await saveLastDisplayName(trimmedDisplay);
      const league = await createLeague(playerId, trimmedName, createAssisted, trimmedDisplay);
      setCreatedCode(league.code);
      reload();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Lig oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setCreateName('');
    setCreateAssisted(false);
    setCreatedCode(null);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Kopyalandı', `Lig kodu "${code}" panoya kopyalandı.`);
  };

  const handleJoin = async () => {
    const trimmedCode = joinCode.trim().toUpperCase();
    const trimmedDisplay = joinDisplayName.trim();
    if (!trimmedCode || !trimmedDisplay) {
      Alert.alert('Hata', 'Lig kodu ve takma ad gerekli.');
      return;
    }
    try {
      setJoining(true);
      const playerId = getPlayerId();
      await saveLastDisplayName(trimmedDisplay);
      const league = await joinLeague(playerId, trimmedCode, trimmedDisplay);
      setShowJoin(false);
      setJoinCode('');
      navigation.navigate('LeagueDetail', { leagueId: league.id });
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Lige katılınamadı.');
    } finally {
      setJoining(false);
    }
  };

  const getWinRateColor = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return colors.border;
    const rate = wins / total;
    if (rate >= 0.6) return ACCENT_EMERALD;
    if (rate >= 0.4) return ACCENT_GOLD;
    return colors.error;
  };

  const renderItem = ({ item }: { item: LeagueListItem }) => {
    const { league, myStats } = item;
    const totalMatches = myStats.wins + myStats.losses;
    const winRate = totalMatches > 0 ? myStats.wins / totalMatches : 0;
    const accentColor = getWinRateColor(myStats.wins, myStats.losses);

    return (
      <Pressable
        style={({ pressed }) => [styles.leagueCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
        onPress={() => navigation.navigate('LeagueDetail', { leagueId: league.id })}
      >
        <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.leagueName} numberOfLines={1}>{league.name}</Text>
              <View style={[styles.modeBadge, league.assistedMode ? styles.modeBadgeAssisted : styles.modeBadgeUnassisted]}>
                <Text style={[styles.modeBadgeText, league.assistedMode ? styles.modeBadgeTextAssisted : styles.modeBadgeTextUnassisted]}>
                  {league.assistedMode ? '\u{2728} Yardımlı' : '\u{1F512} Yardımsız'}
                </Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.memberCount}>{league.memberCount} oyuncu</Text>
              <Pressable onPress={() => handleCopyCode(league.code)} hitSlop={8}>
                <Text style={styles.codeCopyable}>{league.code}</Text>
              </Pressable>
            </View>
          </View>

          {totalMatches > 0 ? (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{myStats.wins}</Text>
                <Text style={styles.statLabel}>Galibiyet</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.error }]}>{myStats.losses}</Text>
                <Text style={styles.statLabel}>Mağlubiyet</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: accentColor }]}>
                  %{Math.round(winRate * 100)}
                </Text>
                <Text style={styles.statLabel}>Oran</Text>
              </View>
              <View style={styles.winBar}>
                <View style={styles.winBarTrack}>
                  <View style={[styles.winBarFill, { flex: myStats.wins, backgroundColor: ACCENT_EMERALD }]} />
                  <View style={[styles.winBarFill, { flex: myStats.losses || 0.01, backgroundColor: colors.error + '60' }]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noMatchRow}>
              <Text style={styles.noMatchText}>Henüz maç oynanmadı</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowIcon}>{'\u203A'}</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'\u2039'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{'\u{1F3C6}'} Ligler</Text>
          <Text style={styles.headerSubtitle}>Arkadaşlarınla rekabet et</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT_GOLD} size="large" />
        </View>
      ) : (
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.league.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{'\u{1F3AF}'}</Text>
              <Text style={styles.emptyTitle}>Henüz bir ligin yok</Text>
              <Text style={styles.emptySubtext}>
                Lig oluştur ve arkadaşlarını davet et,{'\n'}veya bir koda sahipsen lige katıl!
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.createButton, pressed && { opacity: 0.85 }]}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.actionButtonText}>Lig Oluştur</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.joinButton, pressed && { opacity: 0.85 }]}
          onPress={() => setShowJoin(true)}
        >
          <Text style={styles.joinButtonIcon}>{'\u{1F517}'}</Text>
          <Text style={styles.actionButtonText}>Lige Katıl</Text>
        </Pressable>
      </View>

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={handleCloseCreate}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); handleCloseCreate(); }}>
          <Pressable style={styles.modalContent} onPress={() => Keyboard.dismiss()}>
            {createdCode ? (
              <>
                <Text style={styles.successIcon}>{'\u{1F389}'}</Text>
                <Text style={styles.modalTitle}>Lig Oluşturuldu!</Text>
                <Text style={styles.modalLabel}>Lig Kodu:</Text>
                <Pressable style={styles.codeDisplay} onPress={() => handleCopyCode(createdCode)}>
                  <Text style={styles.codeText}>{createdCode}</Text>
                  <Text style={styles.copyHint}>Kopyalamak için dokun</Text>
                </Pressable>
                <Text style={styles.codeHint}>Bu kodu arkadaşlarınla paylaş</Text>
                <Pressable
                  style={({ pressed }) => [styles.modalButton, pressed && { opacity: 0.7 }]}
                  onPress={handleCloseCreate}
                >
                  <Text style={styles.modalButtonText}>Tamam</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Lig Oluştur</Text>

                <Text style={styles.modalLabel}>Lig Adı</Text>
                <TextInput
                  style={styles.input}
                  value={createName}
                  onChangeText={setCreateName}
                  placeholder="Lig adı gir..."
                  placeholderTextColor={colors.textSecondary}
                  maxLength={30}
                  autoFocus
                />

                <Text style={styles.modalLabel}>Takma Adın</Text>
                <TextInput
                  style={styles.input}
                  value={createDisplayName}
                  onChangeText={setCreateDisplayName}
                  placeholder="Takma ad gir..."
                  placeholderTextColor={colors.textSecondary}
                  maxLength={20}
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Yardımlı Mod</Text>
                  <Switch
                    value={createAssisted}
                    onValueChange={setCreateAssisted}
                    trackColor={{ false: colors.border, true: ACCENT_GOLD + '80' }}
                    thumbColor={createAssisted ? ACCENT_GOLD : colors.textSecondary}
                  />
                </View>
                <Text style={styles.switchHint}>
                  {createAssisted
                    ? 'Tüm maçlar yardımlı modda oynanır'
                    : 'Tüm maçlar yardımsız modda oynanır'}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    pressed && { opacity: 0.7 },
                    creating && { opacity: 0.5 },
                  ]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <Text style={styles.modalButtonText}>Oluştur</Text>
                  )}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoin} transparent animationType="fade" onRequestClose={() => setShowJoin(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setShowJoin(false); }}>
          <Pressable style={styles.modalContent} onPress={() => Keyboard.dismiss()}>
            <Text style={styles.modalTitle}>Lige Katıl</Text>

            <Text style={styles.modalLabel}>Lig Kodu</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="6 haneli kod..."
              placeholderTextColor={colors.textSecondary}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />

            <Text style={styles.modalLabel}>Takma Adın</Text>
            <TextInput
              style={styles.input}
              value={joinDisplayName}
              onChangeText={setJoinDisplayName}
              placeholder="Takma ad gir..."
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
            />

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                styles.joinModalButton,
                pressed && { opacity: 0.7 },
                joining && { opacity: 0.5 },
              ]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.modalButtonText}>Katıl</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ACCENT_GOLD,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    width: 36,
  },

  // Center / loading
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },

  // League card
  leagueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
  },
  cardTop: {
    marginBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  modeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  modeBadgeAssisted: {
    backgroundColor: ACCENT_GOLD + '20',
    borderColor: ACCENT_GOLD + '50',
  },
  modeBadgeUnassisted: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '40',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modeBadgeTextAssisted: {
    color: ACCENT_GOLD,
  },
  modeBadgeTextUnassisted: {
    color: colors.primary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  codeCopyable: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background + '80',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ACCENT_EMERALD,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  winBar: {
    flex: 1,
    justifyContent: 'center',
  },
  winBarTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border + '40',
  },
  winBarFill: {
    height: '100%',
  },

  // No match placeholder in card
  noMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background + '60',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noMatchText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    marginTop: -1,
  },

  // Bottom buttons
  bottomButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  createButton: {
    backgroundColor: ACCENT_ORANGE,
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  createButtonIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: -1,
  },
  joinButtonIcon: {
    fontSize: 14,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: ACCENT_GOLD + '30',
  },
  successIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  switchHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalButton: {
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  joinModalButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  codeDisplay: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: ACCENT_GOLD + '40',
  },
  codeText: {
    fontSize: 30,
    fontWeight: '800',
    color: ACCENT_GOLD,
    letterSpacing: 6,
  },
  copyHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  codeHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
