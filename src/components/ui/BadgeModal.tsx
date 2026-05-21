import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withSequence,
  withSpring,
  withDelay,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { BadgeEarned } from '@/types';
import { BADGES } from '@/data/badges';

interface Props {
  badges: BadgeEarned[];
  onDismiss: () => void;
}

export function BadgeModal({ badges, onDismiss }: Props) {
  const badge = badges[0];
  const def = BADGES.find((b) => b.id === badge?.badgeId);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (badge) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 300 }),
        withSpring(1.0, { damping: 10 }),
      );
    }
  }, [badge]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!badge || !def) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View style={[styles.card, animStyle]}>
          <Text style={styles.newBadge}>New Badge! 🎉</Text>
          <Text style={styles.emoji}>{def.emoji}</Text>
          <Text style={styles.title}>{def.title}</Text>
          <Text style={styles.desc}>{def.description}</Text>
          <View style={styles.tapHint}>
            <Text style={styles.tapText}>Tap anywhere to continue</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  newBadge: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    color: '#FF6B6B',
  },
  emoji: { fontSize: 72 },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: '#2D3436',
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#636E72',
    textAlign: 'center',
  },
  tapHint: { marginTop: 8 },
  tapText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: '#B2BEC3',
  },
});
