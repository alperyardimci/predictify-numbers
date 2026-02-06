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
): { bulls: number; cows: number } {
  let bulls = 0;
  let cows = 0;

  const secretArr = secret.split('');
  const guessArr = guess.split('');
  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);

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
        break;
      }
    }
  }

  return { bulls, cows };
}

export function getDigitStatuses(
  secret: string,
  guess: string
): ('bull' | 'cow' | 'miss')[] {
  const statuses: ('bull' | 'cow' | 'miss')[] = new Array(guess.length).fill('miss');
  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);

  // First pass: mark bulls (exact matches)
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      statuses[i] = 'bull';
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: mark cows (wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (guessUsed[i]) continue;

    for (let j = 0; j < secret.length; j++) {
      if (secretUsed[j]) continue;

      if (guess[i] === secret[j]) {
        statuses[i] = 'cow';
        secretUsed[j] = true;
        break;
      }
    }
  }

  return statuses;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
