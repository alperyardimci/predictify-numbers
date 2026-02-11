import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

interface DisconnectBannerProps {
  countdown: number;
}

export function DisconnectBanner({ countdown }: DisconnectBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Rakibin bağlantısı zayıf... {countdown}sn
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
