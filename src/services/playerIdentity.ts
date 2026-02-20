import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

let resolveAuthReady: (user: User) => void;
let authReadyPromise = new Promise<User>((resolve) => {
  resolveAuthReady = resolve;
});

let currentUser: User | null = null;

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    resolveAuthReady(user);
  } else {
    // No user — sign in anonymously
    try {
      const credential = await signInAnonymously(auth);
      currentUser = credential.user;
      resolveAuthReady(credential.user);
    } catch (err) {
      console.error('[Auth] Anonymous sign-in failed:', err);
    }
  }
});

/**
 * Returns the current user's UID. Waits for auth to be ready.
 */
export async function getPlayerId(): Promise<string> {
  if (currentUser) return currentUser.uid;
  const user = await authReadyPromise;
  return user.uid;
}

/**
 * Wait for Firebase Auth to be fully initialized.
 */
export async function waitForAuth(): Promise<User> {
  if (currentUser) return currentUser;
  return authReadyPromise;
}
