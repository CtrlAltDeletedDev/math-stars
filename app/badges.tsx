import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { BADGES } from '@/data/badges';
import { useProgress } from '@/store/useProgress';
import { getTheme } from '@/data/shop';

export default function BadgesScreen() {
  const router = useRouter();
  const { progress } = useProgress();
  const theme = getTheme(progress.activeTheme);
  const earnedIds = new Set(progress.earnedBadges.map((b) => b.badgeId));
  const earnedCount = earnedIds.size;

  return (
    <BackgroundGradient colors={theme.colors}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Badges 🏅</Text>
        <Text style={styles.count}>{earnedCount}/{BADGES.length}</Text>
      </View>

      <FlatList
        data={BADGES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const earned = earnedIds.has(item.id);
          return (
            <View style={[styles.badge, !earned && styles.badgeLocked]}>
              <Text style={[styles.badgeEmoji, !earned && styles.locked]}>{earned ? item.emoji : '🔒'}</Text>
              <Text style={[styles.badgeName, !earned && styles.lockedText]}>{item.title}</Text>
              <Text style={[styles.badgeDesc, !earned && styles.lockedText]}>{item.description}</Text>
            </View>
          );
        }}
      />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  backText: { fontFamily: 'Nunito-Bold', fontSize: 18, color: '#fff' },
  title: {
    flex: 1,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  count: { fontFamily: 'Nunito-Bold', fontSize: 16, color: 'rgba(255,255,255,0.85)' },
  grid: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  row: { gap: 12 },
  badge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,0.1)' },
  badgeEmoji: { fontSize: 40 },
  locked: { opacity: 0.4 },
  badgeName: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  lockedText: { color: 'rgba(255,255,255,0.4)' },
});
