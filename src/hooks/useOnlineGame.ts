import { useReducer, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  OnlineGameState,
  OnlineGameAction,
  OnlineGamePhase,
  PlayerSlot,
  OnlineGameRoom,
} from '../types/online';
import { Guess } from '../types';
import {
  listenToGame,
  submitCoinFlipPick,
  submitGuess,
  updateHeartbeat,
  claimDisconnectWin,
  skipTurn,
  forfeitGame,
} from '../services/onlineGame';

const initialState: OnlineGameState = {
  phase: 'loading',
  gameId: null,
  mySlot: null,
  room: null,
  myGuesses: [],
  opponentGuesses: [],
  opponentGuessCount: 0,
  isMyTurn: false,
  turnTimeLeft: null,
  coinFlipPick: null,
  disconnectCountdown: null,
  error: null,
};

function reducer(state: OnlineGameState, action: OnlineGameAction): OnlineGameState {
  switch (action.type) {
    case 'SET_GAME_INFO':
      return {
        ...state,
        gameId: action.gameId,
        mySlot: action.mySlot,
      };
    case 'ROOM_UPDATE': {
      const room = action.room;
      const mySlot = action.mySlot;
      const opponentSlot: PlayerSlot = mySlot === 'player1' ? 'player2' : 'player1';

      // Parse my guesses from the room
      const myGuessesObj = room.guesses?.[mySlot] || {};
      const myGuesses: Guess[] = Object.values(myGuessesObj)
        .sort((a: any, b: any) => b.index - a.index)
        .map((g: any) => ({
          value: g.value,
          bulls: g.bulls,
          cows: g.cows,
          repeats: g.repeats,
        }));

      const opponentGuessesObj = room.guesses?.[opponentSlot] || {};
      const opponentGuessCount = Object.keys(opponentGuessesObj).length;
      const opponentGuesses: Guess[] = Object.values(opponentGuessesObj)
        .sort((a: any, b: any) => b.index - a.index)
        .map((g: any) => ({
          value: g.value,
          bulls: g.bulls,
          cows: g.cows,
          repeats: g.repeats,
        }));

      const isMyTurn = room.status === 'playing' && room.turns.currentTurn === mySlot;

      // Determine phase
      let phase: OnlineGamePhase = state.phase;
      if (room.status === 'coin_flip') {
        const myPick = mySlot === 'player1' ? room.coinFlip.player1Pick : room.coinFlip.player2Pick;
        if (myPick == null) {
          phase = 'coin_flip';
        } else {
          phase = 'picking'; // Waiting for opponent to pick
        }
      } else if (room.status === 'playing') {
        // Show coin result briefly before switching to playing
        if (state.phase === 'picking' || state.phase === 'coin_flip') {
          phase = 'coin_result';
        } else if (state.phase === 'coin_result') {
          // Stay in coin_result until timer moves it
          phase = 'coin_result';
        } else {
          phase = 'playing';
        }
      } else if (room.status === 'finished') {
        phase = 'finished';
      }

      return {
        ...state,
        room,
        myGuesses,
        opponentGuesses,
        opponentGuessCount,
        isMyTurn,
        phase,
      };
    }
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_COIN_PICK':
      return { ...state, coinFlipPick: action.pick };
    case 'SET_TURN_TIME_LEFT':
      return { ...state, turnTimeLeft: action.seconds };
    case 'SET_DISCONNECT_COUNTDOWN':
      return { ...state, disconnectCountdown: action.seconds };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useOnlineGame(gameId: string, mySlot: PlayerSlot) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coinResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const lastRoomRef = useRef<OnlineGameRoom | null>(null);
  const skipTurnCalledRef = useRef(false);

  // Initialize
  useEffect(() => {
    mountedRef.current = true;
    dispatch({ type: 'SET_GAME_INFO', gameId, mySlot });

    // Listen to game room
    unsubscribeRef.current = listenToGame(gameId, (room) => {
      if (!mountedRef.current) return;
      lastRoomRef.current = room;
      dispatch({ type: 'ROOM_UPDATE', room, mySlot });
    });

    // Start heartbeat (every 10 seconds)
    updateHeartbeat(gameId, mySlot).catch(() => {});
    heartbeatRef.current = setInterval(() => {
      if (mountedRef.current) {
        updateHeartbeat(gameId, mySlot).catch(() => {});
      }
    }, 10000);

    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      if (coinResultTimerRef.current) clearTimeout(coinResultTimerRef.current);
    };
  }, [gameId, mySlot]);

  // Handle coin_result → playing transition
  useEffect(() => {
    if (state.phase === 'coin_result') {
      coinResultTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          dispatch({ type: 'SET_PHASE', phase: 'playing' });
        }
      }, 2500);
      return () => {
        if (coinResultTimerRef.current) clearTimeout(coinResultTimerRef.current);
      };
    }
  }, [state.phase]);

  // Monitor opponent disconnect
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'coin_flip' && state.phase !== 'picking') {
      if (disconnectTimerRef.current) {
        clearInterval(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      dispatch({ type: 'SET_DISCONNECT_COUNTDOWN', seconds: null });
      return;
    }

    disconnectTimerRef.current = setInterval(() => {
      if (!mountedRef.current || !lastRoomRef.current) return;
      const room = lastRoomRef.current;
      if (room.status === 'finished') return;

      const opponentSlot: PlayerSlot = mySlot === 'player1' ? 'player2' : 'player1';
      const opponentLastSeen = room[opponentSlot]?.lastSeen || 0;
      const elapsed = Date.now() - opponentLastSeen;

      if (elapsed > 30000) {
        // Claim disconnect win
        claimDisconnectWin(gameId, mySlot).catch(() => {});
        dispatch({ type: 'SET_DISCONNECT_COUNTDOWN', seconds: 0 });
      } else if (elapsed > 15000) {
        const remaining = Math.ceil((30000 - elapsed) / 1000);
        dispatch({ type: 'SET_DISCONNECT_COUNTDOWN', seconds: remaining });
      } else {
        dispatch({ type: 'SET_DISCONNECT_COUNTDOWN', seconds: null });
      }
    }, 1000);

    return () => {
      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
    };
  }, [state.phase, gameId, mySlot]);

  // Handle AppState changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && mountedRef.current) {
        updateHeartbeat(gameId, mySlot).catch(() => {});
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [gameId, mySlot]);

  // Turn timer (30 seconds per turn)
  useEffect(() => {
    if (state.phase !== 'playing') {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      dispatch({ type: 'SET_TURN_TIME_LEFT', seconds: null });
      return;
    }

    skipTurnCalledRef.current = false;

    turnTimerRef.current = setInterval(() => {
      if (!mountedRef.current || !lastRoomRef.current) return;
      const room = lastRoomRef.current;
      if (room.status !== 'playing' || !room.turns.turnStartedAt) return;

      const elapsed = Math.floor((Date.now() - room.turns.turnStartedAt) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      dispatch({ type: 'SET_TURN_TIME_LEFT', seconds: remaining });

      // Auto-skip turn when time runs out (only the current turn player's client)
      if (remaining <= 0 && room.turns.currentTurn === mySlot && !skipTurnCalledRef.current) {
        skipTurnCalledRef.current = true;
        skipTurn(gameId, mySlot).catch(() => {});
      }
    }, 1000);

    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [state.phase, gameId, mySlot]);

  const pickCoinFlip = useCallback(
    async (pick: number) => {
      dispatch({ type: 'SET_COIN_PICK', pick });
      await submitCoinFlipPick(gameId, mySlot, pick);
    },
    [gameId, mySlot]
  );

  const makeGuess = useCallback(
    async (guessValue: string) => {
      await submitGuess(gameId, mySlot, guessValue);
    },
    [gameId, mySlot]
  );

  const forfeit = useCallback(async () => {
    await forfeitGame(gameId, mySlot);
  }, [gameId, mySlot]);

  return {
    state,
    pickCoinFlip,
    makeGuess,
    forfeit,
  };
}
