import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { LevelMap } from '@/components/category/LevelMap';
import { useProgress } from '@/store/useProgress';
import { getCategoryById } from '@/data/categories';
import { Level } from '@/types';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress } = useProgress();

  const category = getCategoryById(id);
  if (!category) return null;

  const catProgress = progress.categories[category.id];

  function handleLevelSelect(level: Level) {
    router.push(`/game/${category!.id}/${level.id}`);
  }

  const bgColors: [string, string] = [category.bgColor, category.darkColor];

  return (
    <BackgroundGradient colors={bgColors}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{category.emoji} {category.title}</Text>
        <View style={styles.spacer} />
      </View>

      <LevelMap
        levels={category.levels}
        progress={catProgress}
        onSelectLevel={handleLevelSelect}
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
  backBtn: {
    padding: 8,
  },
  backText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#fff',
  },
  title: {
    flex: 1,
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
  },
  spacer: {
    width: 60,
  },
});
