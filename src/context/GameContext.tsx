import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, Guess } from '../types';

const initialState: GameState = {
  digits: 4,
  secretNumber: '',
  guesses: [],
  gameStatus: 'playing',
  startTime: 0,
  moveCount: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        digits: action.digits,
        secretNumber: action.secretNumber,
        startTime: Date.now(),
        gameStatus: 'playing',
      };
    case 'MAKE_GUESS':
      return {
        ...state,
        guesses: [action.guess, ...state.guesses],
        moveCount: state.moveCount + 1,
      };
    case 'WIN_GAME':
      return {
        ...state,
        gameStatus: 'won',
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
