import {
  ref,
  get,
  onValue,
  onChildAdded,
  off,
} from 'firebase/database';
import { database } from './firebase';
import { League, LeagueMember, LeagueListItem, LeagueChallenge, LeagueMatch } from '../types/league';
import { query, orderByChild, limitToLast } from 'firebase/database';
import {
  createLeagueFn,
  joinLeagueFn,
  leaveLeagueFn,
  sendChallengeFn,
  acceptChallengeFn,
  declineChallengeFn,
  cancelChallengeFn,
  updateLeagueStatsFn,
} from './cloudFunctions';

/**
 * Create a new league via Cloud Function.
 */
export async function createLeague(
  name: string,
  assistedMode: boolean,
  displayName: string
): Promise<League> {
  const result = await createLeagueFn({ name, assistedMode, displayName });
  return result.data as League;
}

/**
 * Join a league by its 6-char code via Cloud Function.
 */
export async function joinLeague(
  code: string,
  displayName: string
): Promise<League> {
  const result = await joinLeagueFn({ code, displayName });
  return result.data as League;
}

/**
 * Leave a league via Cloud Function.
 */
export async function leaveLeague(leagueId: string): Promise<void> {
  await leaveLeagueFn({ leagueId });
}

/**
 * Get all leagues the player belongs to (read-only).
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
 * Get a single league by ID (read-only).
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
 * Update league stats after a game finishes via Cloud Function.
 */
export async function updateLeagueStats(gameId: string): Promise<void> {
  await updateLeagueStatsFn({ gameId });
}

// --- Challenge System ---

/**
 * Send a challenge via Cloud Function.
 */
export async function sendChallenge(
  targetId: string,
  leagueId: string
): Promise<string> {
  const result = await sendChallengeFn({ targetId, leagueId });
  return result.data.challengeId;
}

/**
 * Accept a challenge via Cloud Function.
 */
export async function acceptChallenge(challengeId: string): Promise<{ gameId: string; mySlot: 'player1' | 'player2' }> {
  const result = await acceptChallengeFn({ challengeId });
  return { gameId: result.data.gameId, mySlot: result.data.mySlot as 'player1' | 'player2' };
}

/**
 * Decline a challenge via Cloud Function.
 */
export async function declineChallenge(challengeId: string): Promise<void> {
  await declineChallengeFn({ challengeId });
}

/**
 * Cancel a sent challenge via Cloud Function.
 */
export async function cancelChallenge(challengeId: string): Promise<void> {
  await cancelChallengeFn({ challengeId });
}

/**
 * Listen for incoming challenges directed at this player (read-only).
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
      return;
    }

    const cData = cSnap.val();
    if (cData.status === 'pending' && Date.now() - cData.timestamp < 60000) {
      onChallenge({ ...cData, id: challengeId });
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
 * Listen for updates on a specific challenge (for the sender) (read-only).
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
