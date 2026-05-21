import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GAME_CONFIG } from '@/constants/gameConfig';

interface Props {
  streak: number;
}

export function StreakBar({ streak }: Props) {
  if (streak < 2) return null;

  const display = Math.min(streak, GAME_CONFIG.maxStreakDisplay);

  return (
    <View style={styles.container}>
      <Text style={styles.flames}>{'🔥'.repeat(display)}</Text>
      <Text style={styles.label}>{streak} streak!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  flames: {
    fontSize: 22,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#fff',
  },
});
