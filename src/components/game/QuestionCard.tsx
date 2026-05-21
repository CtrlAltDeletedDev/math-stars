import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import { Question } from '@/types';

interface Props {
  question: Question;
}

export function QuestionCard({ question }: Props) {
  function handleSpeak() {
    const text = question.speakText ?? question.prompt;
    Speech.speak(text, { language: 'en-US', rate: 0.85, pitch: 1.1 });
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.prompt}>{question.prompt}</Text>
        <Pressable onPress={handleSpeak} style={styles.speakBtn} hitSlop={12}>
          <Text style={styles.speakIcon}>🔊</Text>
        </Pressable>
      </View>
      {question.promptEmoji ? (
        <Text style={styles.emoji} numberOfLines={4} adjustsFontSizeToFit>
          {question.promptEmoji}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  prompt: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 30,
    color: '#2D3436',
    textAlign: 'center',
    flex: 1,
  },
  speakBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  speakIcon: { fontSize: 22 },
  emoji: {
    fontSize: 34,
    textAlign: 'center',
    lineHeight: 46,
  },
});
