import { initializeApp } from 'firebase-admin/app';

initializeApp();

// Game functions
export { coinFlipPick, submitGuess, heartbeat, claimDisconnectWin, skipTurn, forfeit } from './game';

// Matchmaking functions
export { joinQueue, leaveQueue, tryMatch } from './matchmaking';

// League functions
export {
  createLeague,
  joinLeague,
  leaveLeague,
  sendChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
} from './league';

// Stats functions
export { updateLeagueStats, clearNotification } from './stats';
