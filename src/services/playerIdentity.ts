import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYER_ID_KEY = '@predictify_player_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedPlayerId: string | null = null;

export async function getPlayerId(): Promise<string> {
  if (cachedPlayerId) return cachedPlayerId;

  let id = await AsyncStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(PLAYER_ID_KEY, id);
  }
  cachedPlayerId = id;
  return id;
}
