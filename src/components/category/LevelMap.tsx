import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Level, CategoryProgress } from '@/types';
import { COLORS } from '@/constants/colors';

interface Props {
  levels: Level[];
  progress: CategoryProgress | undefined;
  onSelectLevel: (level: Level) => void;
}

export function LevelMap({ levels, progress, onSelectLevel }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {levels.map((level, idx) => {
        const state = progress?.levels[level.id];
        const status = state?.status ?? 'locked';
        const stars = state?.starsEarned ?? 0;
        const isLocked = status === 'locked';
        const isCompleted = status === 'completed';

        return (
          <View key={level.id} style={styles.nodeWrapper}>
            {idx > 0 && <View style={[styles.connector, isLocked && styles.connectorLocked]} />}
            <Pressable
              style={[
                styles.node,
                isCompleted && styles.nodeCompleted,
                isLocked && styles.nodeLocked,
              ]}
              onPress={() => !isLocked && onSelectLevel(level)}
              disabled={isLocked}
            >
              {isLocked ? (
                <Text style={styles.lockIcon}>🔒</Text>
              ) : (
                <Text style={styles.levelNum}>{level.levelNumber}</Text>
              )}
            </Pressable>
            <Text style={[styles.levelTitle, isLocked && styles.lockedText]}>{level.title}</Text>
            {stars > 0 && <Text style={styles.levelStars}>{'⭐'.repeat(stars)}</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 60,
    gap: 0,
  },
  nodeWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  connector: {
    width: 4,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginVertical: 2,
  },
  connectorLocked: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  node: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  nodeCompleted: {
    backgroundColor: '#FFD700',
  },
  nodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  levelNum: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: '#2D3436',
  },
  lockIcon: {
    fontSize: 28,
  },
  levelTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  lockedText: {
    color: 'rgba(255,255,255,0.5)',
  },
  levelStars: {
    fontSize: 18,
  },
});
