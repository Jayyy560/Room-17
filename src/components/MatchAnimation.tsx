import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';

export const MatchAnimation: React.FC<{ visible: boolean }> = ({ visible }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.1, duration: 400, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 400, easing: Easing.ease, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.stopAnimation();
      scale.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scale.interpolate({ inputRange: [0, 1.1], outputRange: [0.8, 1.1] }) }] },
      ]}
    >
      <Text style={styles.title}>Match!</Text>
      <Text style={styles.subtitle}>Signal lock achieved.</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.shadow.color,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
    shadowOffset: theme.shadow.offset,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  subtitle: {
    color: theme.colors.muted,
  },
});
