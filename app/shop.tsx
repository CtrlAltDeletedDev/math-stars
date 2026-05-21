import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { BigButton } from '@/components/ui/BigButton';
import { SHOP_ITEMS } from '@/data/shop';
import { getTheme } from '@/data/shop';
import { useProgress } from '@/store/useProgress';
import { COLORS } from '@/constants/colors';

export default function ShopScreen() {
  const router = useRouter();
  const { progress, purchaseItem, setActiveTheme } = useProgress();
  const [justBought, setJustBought] = useState<string | null>(null);

  const theme = getTheme(progress.activeTheme);

  function handleBuy(itemId: string, cost: number, themeValue: string) {
    const owned = progress.purchasedItems.includes(itemId);
    if (owned) {
      setActiveTheme(themeValue);
      setJustBought(itemId);
      return;
    }
    if (progress.spendableStars < cost) {
      Alert.alert('Not enough stars!', `You need ${cost} ⭐ but only have ${progress.spendableStars} ⭐`);
      return;
    }
    purchaseItem(itemId);
    setActiveTheme(themeValue);
    setJustBought(itemId);
  }

  return (
    <BackgroundGradient colors={theme.colors}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Star Shop 🛍️</Text>
        <View style={styles.starCount}>
          <Text style={styles.starText}>⭐ {progress.spendableStars}</Text>
        </View>
      </View>

      <FlatList
        data={SHOP_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const owned = progress.purchasedItems.includes(item.id);
          const active = justBought === item.id || (progress.activeTheme === item.value && owned);
          const canAfford = progress.spendableStars >= item.cost;

          return (
            <Pressable
              style={[styles.card, active && styles.cardActive]}
              onPress={() => handleBuy(item.id, item.cost, item.value)}
            >
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
              <View style={styles.itemAction}>
                {owned ? (
                  <Text style={styles.ownedText}>{active ? '✓ Active' : 'Use'}</Text>
                ) : (
                  <Text style={[styles.costText, !canAfford && styles.cantAfford]}>
                    ⭐ {item.cost}
                  </Text>
                )}
              </View>
            </Pressable>
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
  starCount: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  starText: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#fff',
  },
  itemEmoji: { fontSize: 36 },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: '#fff' },
  itemDesc: { fontFamily: 'Nunito-Bold', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  itemAction: { alignItems: 'center' },
  ownedText: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: '#FFD700' },
  costText: { fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: '#FFD700' },
  cantAfford: { color: 'rgba(255,255,255,0.4)' },
});
