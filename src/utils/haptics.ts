import { Platform } from 'react-native';

// Re-export enums so call sites don't need to change
export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

const noop = async () => {};

export const impactAsync: (style?: ImpactFeedbackStyle) => Promise<void> =
  Platform.OS === 'web'
    ? noop
    : async (style) => {
        const Haptics = await import('expo-haptics');
        await Haptics.impactAsync(style as unknown as Haptics.ImpactFeedbackStyle);
      };

export const notificationAsync: (type?: NotificationFeedbackType) => Promise<void> =
  Platform.OS === 'web'
    ? noop
    : async (type) => {
        const Haptics = await import('expo-haptics');
        await Haptics.notificationAsync(type as unknown as Haptics.NotificationFeedbackType);
      };
