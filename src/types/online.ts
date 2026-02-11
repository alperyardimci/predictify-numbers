import { Guess } from './index';

export interface OnlinePlayer {
  id: string;
  lastSeen: number;
}

export interface CoinFlipData {
  systemDigit: number;
  player1Pick: number | null;
  player2Pick: number | null;
  firstTurn: 'player1' | 'player2' | null;
}

export interface OnlineGuess extends Guess {
  index: number;
}

export interface OnlineGameRoom {
  status: 'coin_flip' | 'playing' | 'finished';
  secretNumber: string;
  assistedMode: boolean;
  player1: OnlinePlayer;
  player2: OnlinePlayer;
  coinFlip: CoinFlipData;
  turns: {
    currentTurn: 'player1' | 'player2';
    turnNumber: number;
    turnStartedAt: number;
  };
  guesses: {
    player1: Record<string, OnlineGuess>;
    player2: Record<string, OnlineGuess>;
  };
  result: {
    winner: 'player1' | 'player2' | null;
    reason: 'guessed' | 'disconnect' | 'forfeit' | null;
    winnerGuessCount: number | null;
  };
}

export type PlayerSlot = 'player1' | 'player2';

export interface MatchmakingEntry {
  playerId: string;
  timestamp: number;
  assistedMode: boolean;
}

export interface PlayerNotification {
  gameId: string;
  slot: PlayerSlot;
}

// State for the online game hook
export type OnlineGamePhase = 'loading' | 'coin_flip' | 'picking' | 'coin_result' | 'playing' | 'finished';

export interface OnlineGameState {
  phase: OnlineGamePhase;
  gameId: string | null;
  mySlot: PlayerSlot | null;
  room: OnlineGameRoom | null;
  myGuesses: Guess[];
  opponentGuesses: Guess[];
  opponentGuessCount: number;
  isMyTurn: boolean;
  turnTimeLeft: number | null;
  coinFlipPick: number | null;
  disconnectCountdown: number | null;
  error: string | null;
}

export type OnlineGameAction =
  | { type: 'SET_GAME_INFO'; gameId: string; mySlot: PlayerSlot }
  | { type: 'ROOM_UPDATE'; room: OnlineGameRoom; mySlot: PlayerSlot }
  | { type: 'SET_PHASE'; phase: OnlineGamePhase }
  | { type: 'SET_COIN_PICK'; pick: number }
  | { type: 'SET_TURN_TIME_LEFT'; seconds: number | null }
  | { type: 'SET_DISCONNECT_COUNTDOWN'; seconds: number | null }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };
