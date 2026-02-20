import {
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  onChildAdded,
  off,
  update,
  runTransaction,
} from 'firebase/database';
import { database } from './firebase';
import { League, LeagueMember, LeagueListItem, LeagueChallenge, LeagueMatch } from '../types/league';
import { query, orderByChild, limitToLast } from 'firebase/database';
import { generateLeagueCode } from '../utils/leagueRanking';
import { generateNumber } from '../utils/gameLogic';

const MAX_LEAGUES = 5;

/**
 * Count how many leagues a player belongs to.
 */
async function countPlayerLeagues(playerId: string): Promise<number> {
  const snap = await get(ref(database, `playerLeagues/${playerId}`));
  if (!snap.exists()) return 0;
  return Object.keys(snap.val()).length;
}

/**
 * Create a new league. Generates a unique 6-char code.
 */
export async function createLeague(
  playerId: string,
  name: string,
  assistedMode: boolean,
  displayName: string
): Promise<League> {
  // Check max league limit
  const count = await countPlayerLeagues(playerId);
  if (count >= MAX_LEAGUES) {
    throw new Error(`En fazla ${MAX_LEAGUES} ligde yer alabilirsin.`);
  }

  // Generate unique code (retry if collision)
  let code: string;
  let attempts = 0;
  do {
    code = generateLeagueCode();
    const existing = await get(ref(database, `leagueCodes/${code}`));
    if (!existing.exists()) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Kod oluşturulamadı, tekrar deneyin.');
  }

  const leagueRef = push(ref(database, 'leagues'));
  const leagueId = leagueRef.key!;
  const now = Date.now();

  const league: Omit<League, 'id'> = {
    name,
    code,
    createdBy: playerId,
    createdAt: now,
    assistedMode,
    memberCount: 1,
  };

  const member: Omit<LeagueMember, 'playerId'> = {
    displayName,
    joinedAt: now,
    wins: 0,
    losses: 0,
    totalGuessesInWins: 0,
    lastMatchAt: 0,
  };

  // Write all in parallel
  await Promise.all([
    set(leagueRef, league),
    set(ref(database, `leagueMembers/${leagueId}/${playerId}`), member),
    set(ref(database, `playerLeagues/${playerId}/${leagueId}`), true),
    set(ref(database, `leagueCodes/${code}`), leagueId),
  ]);

  return { ...league, id: leagueId };
}

/**
 * Join a league by its 6-char code.
 */
export async function joinLeague(
  playerId: string,
  code: string,
  displayName: string
): Promise<League> {
  // Check max league limit
  const count = await countPlayerLeagues(playerId);
  if (count >= MAX_LEAGUES) {
    throw new Error(`En fazla ${MAX_LEAGUES} ligde yer alabilirsin.`);
  }

  const upperCode = code.toUpperCase();

  // Lookup league ID from code
  const codeSnap = await get(ref(database, `leagueCodes/${upperCode}`));
  if (!codeSnap.exists()) {
    throw new Error('Geçersiz lig kodu.');
  }
  const leagueId = codeSnap.val() as string;

  // Check if already a member
  const memberSnap = await get(ref(database, `leagueMembers/${leagueId}/${playerId}`));
  if (memberSnap.exists()) {
    throw new Error('Bu lige zaten katıldın.');
  }

  // Get league info
  const leagueSnap = await get(ref(database, `leagues/${leagueId}`));
  if (!leagueSnap.exists()) {
    throw new Error('Lig bulunamadı.');
  }
  const leagueData = leagueSnap.val();

  const now = Date.now();
  const member: Omit<LeagueMember, 'playerId'> = {
    displayName,
    joinedAt: now,
    wins: 0,
    losses: 0,
    totalGuessesInWins: 0,
    lastMatchAt: 0,
  };

  // Write member + index
  await Promise.all([
    set(ref(database, `leagueMembers/${leagueId}/${playerId}`), member),
    set(ref(database, `playerLeagues/${playerId}/${leagueId}`), true),
  ]);

  // Increment memberCount via transaction
  await runTransaction(ref(database, `leagues/${leagueId}/memberCount`), (current: number | null) => {
    return (current || 0) + 1;
  });

  return { ...leagueData, id: leagueId } as League;
}

/**
 * Leave a league.
 */
export async function leaveLeague(playerId: string, leagueId: string): Promise<void> {
  await Promise.all([
    remove(ref(database, `leagueMembers/${leagueId}/${playerId}`)),
    remove(ref(database, `playerLeagues/${playerId}/${leagueId}`)),
  ]);

  // Decrement memberCount
  await runTransaction(ref(database, `leagues/${leagueId}/memberCount`), (current: number | null) => {
    return Math.max(0, (current || 1) - 1);
  });
}

/**
 * Get all leagues the player belongs to.
 */
export async function getMyLeagues(playerId: string): Promise<LeagueListItem[]> {
  const indexSnap = await get(ref(database, `playerLeagues/${playerId}`));
  if (!indexSnap.exists()) return [];

  const leagueIds = Object.keys(indexSnap.val());
  const items: LeagueListItem[] = [];

  await Promise.all(
    leagueIds.map(async (leagueId) => {
      const [leagueSnap, memberSnap] = await Promise.all([
        get(ref(database, `leagues/${leagueId}`)),
        get(ref(database, `leagueMembers/${leagueId}/${playerId}`)),
      ]);

      if (leagueSnap.exists() && memberSnap.exists()) {
        const leagueData = leagueSnap.val();
        const memberData = memberSnap.val();
        items.push({
          league: { ...leagueData, id: leagueId },
          myStats: { ...memberData, playerId },
        });
      }
    })
  );

  return items;
}

/**
 * Get a single league by ID.
 */
export async function getLeague(leagueId: string): Promise<League | null> {
  const snap = await get(ref(database, `leagues/${leagueId}`));
  if (!snap.exists()) return null;
  return { ...snap.val(), id: leagueId } as League;
}

/**
 * Listen to league members in real-time. Returns unsubscribe function.
 */
export function listenToLeagueMembers(
  leagueId: string,
  onUpdate: (members: LeagueMember[]) => void
): () => void {
  const membersRef = ref(database, `leagueMembers/${leagueId}`);
  const unsub = onValue(membersRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      onUpdate([]);
      return;
    }
    const members: LeagueMember[] = Object.entries(data).map(([pid, val]: [string, any]) => ({
      playerId: pid,
      displayName: val.displayName,
      joinedAt: val.joinedAt,
      wins: val.wins || 0,
      losses: val.losses || 0,
      totalGuessesInWins: val.totalGuessesInWins || 0,
      lastMatchAt: val.lastMatchAt || 0,
    }));
    onUpdate(members);
  });

  return unsub;
}

/**
 * Update league stats after a game finishes.
 * Uses leagueStatsUpdated flag to prevent double-counting.
 */
export async function updateLeagueStats(
  gameId: string,
  leagueId: string,
  winnerId: string,
  loserId: string,
  winnerGuessCount: number,
  reason: string
): Promise<void> {
  // Check & set leagueStatsUpdated flag atomically
  const flagRef = ref(database, `games/${gameId}/leagueStatsUpdated`);
  const flagResult = await runTransaction(flagRef, (current: boolean | null) => {
    if (current === true) return; // abort — already updated
    return true;
  });

  if (!flagResult.committed) return;

  const now = Date.now();

  // Read display names for match record
  const [winnerSnap, loserSnap] = await Promise.all([
    get(ref(database, `leagueMembers/${leagueId}/${winnerId}/displayName`)),
    get(ref(database, `leagueMembers/${leagueId}/${loserId}/displayName`)),
  ]);
  const winnerName = winnerSnap.exists() ? winnerSnap.val() : '?';
  const loserName = loserSnap.exists() ? loserSnap.val() : '?';

  // Update winner stats
  await runTransaction(ref(database, `leagueMembers/${leagueId}/${winnerId}`), (member: any) => {
    if (!member) return member;
    member.wins = (member.wins || 0) + 1;
    if (reason === 'guessed') {
      member.totalGuessesInWins = (member.totalGuessesInWins || 0) + winnerGuessCount;
    }
    member.lastMatchAt = now;
    return member;
  });

  // Update loser stats
  await runTransaction(ref(database, `leagueMembers/${leagueId}/${loserId}`), (member: any) => {
    if (!member) return member;
    member.losses = (member.losses || 0) + 1;
    member.lastMatchAt = now;
    return member;
  });

  // Write match record
  const matchRef = push(ref(database, `leagueMatches/${leagueId}`));
  await set(matchRef, {
    winnerId,
    loserId,
    winnerName,
    loserName,
    reason,
    winnerGuessCount: winnerGuessCount || 0,
    timestamp: now,
  });
}

// ─── Challenge System ───

/**
 * Send a challenge to a specific player in a league.
 */
export async function sendChallenge(
  fromId: string,
  toId: string,
  fromName: string,
  leagueId: string,
  assistedMode: boolean
): Promise<string> {
  const challengeRef = push(ref(database, 'challenges'));
  const challengeId = challengeRef.key!;

  const challenge: Omit<LeagueChallenge, 'id'> = {
    fromId,
    toId,
    fromName,
    leagueId,
    assistedMode,
    status: 'pending',
    gameId: null,
    timestamp: Date.now(),
  };

  await Promise.all([
    set(challengeRef, challenge),
    set(ref(database, `playerChallenges/${toId}/${challengeId}`), true),
  ]);

  return challengeId;
}

/**
 * Accept a challenge: create game room and update challenge.
 */
export async function acceptChallenge(challengeId: string): Promise<{ gameId: string; mySlot: 'player1' | 'player2' }> {
  const snap = await get(ref(database, `challenges/${challengeId}`));
  if (!snap.exists()) throw new Error('Teklif bulunamadı.');

  const challenge = snap.val() as Omit<LeagueChallenge, 'id'>;
  if (challenge.status !== 'pending') throw new Error('Teklif artık geçerli değil.');

  // Create game room (challenger = player1, accepter = player2)
  const gamesRef = ref(database, 'games');
  const newGameRef = push(gamesRef);
  const gameId = newGameRef.key!;

  const secretNumber = generateNumber(6);
  const systemDigit = Math.floor(Math.random() * 10);

  const roomData: Record<string, any> = {
    status: 'coin_flip',
    secretNumber,
    assistedMode: challenge.assistedMode,
    player1: { id: challenge.fromId, lastSeen: Date.now() },
    player2: { id: challenge.toId, lastSeen: Date.now() },
    coinFlip: { systemDigit },
    turns: { currentTurn: 'player1', turnNumber: 1, turnStartedAt: 0 },
    leagueId: challenge.leagueId,
  };

  await set(newGameRef, roomData);

  // Update challenge
  await update(ref(database, `challenges/${challengeId}`), {
    status: 'accepted',
    gameId,
  });

  // Cleanup
  await remove(ref(database, `playerChallenges/${challenge.toId}/${challengeId}`));

  return { gameId, mySlot: 'player2' };
}

/**
 * Decline a challenge.
 */
export async function declineChallenge(challengeId: string, toId: string): Promise<void> {
  await update(ref(database, `challenges/${challengeId}`), { status: 'declined' });
  await remove(ref(database, `playerChallenges/${toId}/${challengeId}`));
}

/**
 * Cancel a sent challenge.
 */
export async function cancelChallenge(challengeId: string, toId: string): Promise<void> {
  await update(ref(database, `challenges/${challengeId}`), { status: 'expired' });
  await remove(ref(database, `playerChallenges/${toId}/${challengeId}`));
}

/**
 * Listen for incoming challenges directed at this player.
 * Uses onChildAdded to reliably detect new entries.
 */
export function listenForChallenges(
  playerId: string,
  onChallenge: (challenge: LeagueChallenge) => void
): () => void {
  const challengesRef = ref(database, `playerChallenges/${playerId}`);

  const unsub = onChildAdded(challengesRef, async (snapshot) => {
    const challengeId = snapshot.key;
    if (!challengeId) return;

    const cSnap = await get(ref(database, `challenges/${challengeId}`));
    if (!cSnap.exists()) {
      remove(ref(database, `playerChallenges/${playerId}/${challengeId}`));
      return;
    }

    const cData = cSnap.val();
    if (cData.status === 'pending' && Date.now() - cData.timestamp < 60000) {
      onChallenge({ ...cData, id: challengeId });
    } else {
      // Expired or non-pending, clean up
      remove(ref(database, `playerChallenges/${playerId}/${challengeId}`));
    }
  });

  return unsub;
}

/**
 * Listen to recent matches in a league (last 20). Returns unsubscribe.
 */
export function listenToLeagueMatches(
  leagueId: string,
  onUpdate: (matches: LeagueMatch[]) => void
): () => void {
  const matchesRef = query(
    ref(database, `leagueMatches/${leagueId}`),
    orderByChild('timestamp'),
    limitToLast(20)
  );
  const unsub = onValue(matchesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      onUpdate([]);
      return;
    }
    const matches: LeagueMatch[] = Object.entries(data)
      .map(([id, val]: [string, any]) => ({
        id,
        winnerId: val.winnerId,
        loserId: val.loserId,
        winnerName: val.winnerName,
        loserName: val.loserName,
        reason: val.reason,
        winnerGuessCount: val.winnerGuessCount || null,
        timestamp: val.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(matches);
  });

  return unsub;
}

/**
 * Listen for updates on a specific challenge (for the sender).
 */
export function listenToChallenge(
  challengeId: string,
  onUpdate: (challenge: LeagueChallenge) => void
): () => void {
  const challengeRef = ref(database, `challenges/${challengeId}`);
  const unsub = onValue(challengeRef, (snapshot) => {
    if (!snapshot.exists()) return;
    onUpdate({ ...snapshot.val(), id: challengeId });
  });

  return () => off(challengeRef);
}
