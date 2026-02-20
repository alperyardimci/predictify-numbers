import { useEffect, useState } from 'react';
import { listenForQueueCounts } from '../services/matchmaking';

export function useQueueCounts() {
  const [counts, setCounts] = useState({ assisted: 0, unassisted: 0 });

  useEffect(() => {
    const unsubscribe = listenForQueueCounts(setCounts);
    return unsubscribe;
  }, []);

  return counts;
}
