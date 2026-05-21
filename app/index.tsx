import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { CategoryCard } from '@/components/home/CategoryCard';
import { StarBadge } from '@/components/ui/StarBadge';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { Category } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { progress } = useProgress();

  function handleCategoryPress(category: Category) {
    router.push(`/category/${category.id}`);
  }

  return (
    <BackgroundGradient colors={['#4FC3F7', '#0288D1']}>
      <View style={styles.header}>
        <Text style={styles.title}>Math Stars! ⭐</Text>
        <StarBadge count={progress.totalStars} />
      </View>

      {progress.currentStreak >= 2 && (
        <Text style={styles.streak}>
          {'🔥'.repeat(Math.min(progress.currentStreak, 7))} {progress.currentStreak} day streak!
        </Text>
      )}

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            progress={progress.categories[item.id]}
            onPress={() => handleCategoryPress(item)}
          />
        )}
      />
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
  streak: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    paddingBottom: 8,
  },
  grid: {
    paddingHorizontal: 14,
    paddingBottom: 30,
    gap: 14,
  },
  row: {
    gap: 14,
  },
});
