import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { CHARACTERS } from '@/data/characters';
import { useProgress } from '@/store/useProgress';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CharacterOption({ char, onSelect }: { char: typeof CHARACTERS[0]; onSelect: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1.0); }}
      style={[styles.charCard, { backgroundColor: char.color }, animStyle]}
    >
      <Text style={styles.charEmoji}>{char.emoji}</Text>
      <Text style={styles.charName}>{char.name}</Text>
    </AnimatedPressable>
  );
}

export default function CharacterSelectScreen() {
  const router = useRouter();
  const { selectCharacter } = useProgress();

  function handleSelect(characterId: string) {
    selectCharacter(characterId);
    router.replace('/');
  }

  return (
    <BackgroundGradient colors={['#4FC3F7', '#0288D1']}>
      <View style={styles.container}>
        <Text style={styles.title}>Pick your friend! 🌟</Text>
        <Text style={styles.subtitle}>They'll cheer you on while you learn!</Text>

        <FlatList
          data={CHARACTERS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <CharacterOption char={item} onSelect={() => handleSelect(item.id)} />
          )}
        />
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 34,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  grid: { paddingHorizontal: 16, paddingBottom: 30, gap: 14 },
  row: { gap: 14 },
  charCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  charEmoji: { fontSize: 56 },
  charName: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 20,
    color: '#fff',
  },
});
