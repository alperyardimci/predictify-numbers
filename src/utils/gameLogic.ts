export function generateNumber(digits: number): string {
  let result = '';

  // First digit cannot be 0
  result += Math.floor(Math.random() * 9) + 1;

  // Remaining digits can be 0-9 (repeats allowed)
  for (let i = 1; i < digits; i++) {
    result += Math.floor(Math.random() * 10);
  }

  return result;
}

export function checkGuess(
  secret: string,
  guess: string
): { bulls: number; cows: number; repeats: number } {
  let bulls = 0;
  let cows = 0;

  const secretArr = secret.split('');
  const guessArr = guess.split('');
  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);
  const cowMatch = new Array(guess.length).fill(-1);

  // First pass: count bulls (exact matches)
  for (let i = 0; i < secretArr.length; i++) {
    if (guessArr[i] === secretArr[i]) {
      bulls++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: count cows (wrong position)
  for (let i = 0; i < guessArr.length; i++) {
    if (guessUsed[i]) continue;

    for (let j = 0; j < secretArr.length; j++) {
      if (secretUsed[j]) continue;

      if (guessArr[i] === secretArr[j]) {
        cows++;
        secretUsed[j] = true;
        cowMatch[i] = j;
        break;
      }
    }
  }

  // Count repeats: matched digits (bull or cow) where the secret has MORE
  // occurrences of that digit than the guess has matched (bull+cow).
  // This means there are still undiscovered occurrences in the secret.
  let repeats = 0;

  for (let i = 0; i < guessArr.length; i++) {
    const isBull = guessArr[i] === secretArr[i];
    const isCow = cowMatch[i] >= 0;
    if (!isBull && !isCow) continue;

    const digit = guessArr[i];
    let totalInSecret = 0;
    let matchedInSecret = 0;
    for (let j = 0; j < secretArr.length; j++) {
      if (secretArr[j] === digit) {
        totalInSecret++;
        if (secretUsed[j]) matchedInSecret++;
      }
    }
    if (matchedInSecret < totalInSecret) {
      repeats++;
    }
  }

  return { bulls, cows, repeats };
}

export type DigitStatus = 'bull' | 'cow' | 'miss' | 'bull-repeat' | 'cow-repeat';

export function getDigitStatuses(
  secret: string,
  guess: string
): DigitStatus[] {
  const statuses: DigitStatus[] = new Array(guess.length).fill('miss');
  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);
  const cowMatch = new Array(guess.length).fill(-1);

  // First pass: mark bulls (exact matches)
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      statuses[i] = 'bull';
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: mark cows (wrong position), track which secret position matched
  for (let i = 0; i < guess.length; i++) {
    if (guessUsed[i]) continue;

    for (let j = 0; j < secret.length; j++) {
      if (secretUsed[j]) continue;

      if (guess[i] === secret[j]) {
        statuses[i] = 'cow';
        secretUsed[j] = true;
        cowMatch[i] = j;
        break;
      }
    }
  }

  // Third pass: mark repeats for both bulls and cows
  // A repeat means the secret has MORE occurrences of this digit than
  // the guess has matched (bull+cow) — there are still undiscovered ones.
  for (let i = 0; i < guess.length; i++) {
    if (statuses[i] !== 'bull' && statuses[i] !== 'cow') continue;

    const digit = guess[i];
    let totalInSecret = 0;
    let matchedInSecret = 0;
    for (let j = 0; j < secret.length; j++) {
      if (secret[j] === digit) {
        totalInSecret++;
        if (secretUsed[j]) matchedInSecret++;
      }
    }
    if (matchedInSecret < totalInSecret) {
      statuses[i] = statuses[i] === 'bull' ? 'bull-repeat' : 'cow-repeat';
    }
  }

  return statuses;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
