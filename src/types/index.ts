export interface Guess {
  value: string;
  bulls: number;
  cows: number;
  repeats: number;
  owner?: 'me' | 'opponent';
  digitStatuses?: import('../utils/gameLogic').DigitStatus[];
}

export interface GameState {
  digits: number;
  secretNumber: string;
  guesses: Guess[];
  gameStatus: 'playing' | 'won';
  startTime: number;
  moveCount: number;
}

export interface Record {
  id: string;
  digits: number;
  moves: number;
  timeSeconds: number;
  date: string;
}

export type RootStackParamList = {
  Home: undefined;
  Game: { digits: number };
  Records: undefined;
  OnlineLobby: undefined;
  OnlineGame: { gameId: string; mySlot: 'player1' | 'player2'; leagueId?: string };
  League: undefined;
  LeagueDetail: { leagueId: string };
};

export type GameAction =
  | { type: 'START_GAME'; digits: number; secretNumber: string }
  | { type: 'MAKE_GUESS'; guess: Guess }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' };
