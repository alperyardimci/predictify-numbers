import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { DigitStatus } from '../utils/gameLogic';

// --- Game ---

export const coinFlipPickFn = httpsCallable<
  { gameId: string; pick: number },
  { success: boolean }
>(functions, 'coinFlipPick');

export const submitGuessFn = httpsCallable<
  { gameId: string; guess: string },
  { bulls: number; cows: number; repeats: number; digitStatuses: DigitStatus[] | null }
>(functions, 'submitGuess');

export const heartbeatFn = httpsCallable<
  { gameId: string },
  { success: boolean }
>(functions, 'heartbeat');

export const claimDisconnectWinFn = httpsCallable<
  { gameId: string },
  { success: boolean }
>(functions, 'claimDisconnectWin');

export const skipTurnFn = httpsCallable<
  { gameId: string },
  { success: boolean }
>(functions, 'skipTurn');

export const forfeitFn = httpsCallable<
  { gameId: string },
  { success: boolean }
>(functions, 'forfeit');

// --- Matchmaking ---

export const joinQueueFn = httpsCallable<
  { assistedMode: boolean; leagueId?: string },
  { entryKey: string }
>(functions, 'joinQueue');

export const leaveQueueFn = httpsCallable<
  { entryKey: string },
  { success: boolean }
>(functions, 'leaveQueue');

export const tryMatchFn = httpsCallable<
  { entryKey: string; assistedMode: boolean; leagueId?: string },
  { matched: boolean; gameId?: string; slot?: string }
>(functions, 'tryMatch');

// --- League ---

export const createLeagueFn = httpsCallable<
  { name: string; assistedMode: boolean; displayName: string },
  { id: string; name: string; code: string; createdBy: string; createdAt: number; assistedMode: boolean; memberCount: number }
>(functions, 'createLeague');

export const joinLeagueFn = httpsCallable<
  { code: string; displayName: string },
  { id: string; name: string; code: string; createdBy: string; createdAt: number; assistedMode: boolean; memberCount: number }
>(functions, 'joinLeague');

export const leaveLeagueFn = httpsCallable<
  { leagueId: string },
  { success: boolean }
>(functions, 'leaveLeague');

export const sendChallengeFn = httpsCallable<
  { targetId: string; leagueId: string },
  { challengeId: string }
>(functions, 'sendChallenge');

export const acceptChallengeFn = httpsCallable<
  { challengeId: string },
  { gameId: string; mySlot: string }
>(functions, 'acceptChallenge');

export const declineChallengeFn = httpsCallable<
  { challengeId: string },
  { success: boolean }
>(functions, 'declineChallenge');

export const cancelChallengeFn = httpsCallable<
  { challengeId: string },
  { success: boolean }
>(functions, 'cancelChallenge');

// --- Stats ---

export const updateLeagueStatsFn = httpsCallable<
  { gameId: string },
  { success: boolean; alreadyUpdated?: boolean }
>(functions, 'updateLeagueStats');

export const clearNotificationFn = httpsCallable<
  void,
  { success: boolean }
>(functions, 'clearNotification');
