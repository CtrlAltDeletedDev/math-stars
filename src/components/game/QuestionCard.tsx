import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Question } from '@/types';

interface Props {
  question: Question;
}

export function QuestionCard({ question }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.promptEmoji ? (
        <Text style={styles.emoji} numberOfLines={3} adjustsFontSizeToFit>
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
    padding: 28,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 16,
  },
  prompt: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 32,
    color: '#2D3436',
    textAlign: 'center',
  },
  emoji: {
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 48,
  },
});
