import AsyncStorage from '@react-native-async-storage/async-storage';
import { Record } from '../types';

const RECORDS_KEY_PREFIX = 'records_';

export async function getRecords(digits: number): Promise<Record[]> {
  try {
    const key = `${RECORDS_KEY_PREFIX}${digits}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
}

export async function saveRecord(record: Record): Promise<void> {
  try {
    const key = `${RECORDS_KEY_PREFIX}${record.digits}`;
    const records = await getRecords(record.digits);

    // Add new record
    records.push(record);

    // Sort by moves first, then by time
    records.sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves;
      }
      return a.timeSeconds - b.timeSeconds;
    });

    // Keep only top 10
    const topRecords = records.slice(0, 10);

    await AsyncStorage.setItem(key, JSON.stringify(topRecords));
  } catch (error) {
    console.error('Error saving record:', error);
  }
}

export async function getBestRecord(digits: number): Promise<Record | null> {
  const records = await getRecords(digits);
  return records.length > 0 ? records[0] : null;
}

export async function clearAllRecords(): Promise<void> {
  try {
    const keys = [2, 3, 4, 5].map(d => `${RECORDS_KEY_PREFIX}${d}`);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing records:', error);
  }
}
