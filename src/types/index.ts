export interface Guess {
  value: string;
  bulls: number;
  cows: number;
  repeats: number;
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
};

export type GameAction =
  | { type: 'START_GAME'; digits: number; secretNumber: string }
  | { type: 'MAKE_GUESS'; guess: Guess }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' };
