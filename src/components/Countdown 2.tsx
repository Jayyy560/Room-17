import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils/theme';

export const Countdown: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  value: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },
});
