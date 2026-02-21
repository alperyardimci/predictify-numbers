import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Cross-platform alert that works on both native and web.
 * On native: uses Alert.alert()
 * On web: uses window.confirm() / window.alert()
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0 || buttons.length === 1) {
    // Simple info alert
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Two-button confirm dialog
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];

  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
  if (confirmed) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
