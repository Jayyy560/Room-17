import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils/theme';

export type UserCardProps = {
  name: string;
  promptAnswer: string;
  photoURL?: string;
  onPress?: () => void;
};

export const UserCard: React.FC<UserCardProps> = ({ name, promptAnswer, photoURL, onPress }) => (
  <View style={styles.card} onTouchEnd={onPress}>
    <View style={styles.avatar}>
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{name[0] || '?'}</Text>
      )}
    </View>
    <View style={styles.content}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.prompt}>{promptAnswer}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.shadow.color,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
    shadowOffset: theme.shadow.offset,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.cardAlt,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.accentDark,
  },
  content: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  prompt: {
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
});
