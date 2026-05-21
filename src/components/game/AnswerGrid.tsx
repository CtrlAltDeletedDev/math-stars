import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BigButton } from '@/components/ui/BigButton';
import { COLORS } from '@/constants/colors';

interface Props {
  choices: string[];
  onSelect: (choice: string) => void;
  selectedChoice: string | null;
  correctAnswer: string;
  disabled: boolean;
}

export function AnswerGrid({ choices, onSelect, selectedChoice, correctAnswer, disabled }: Props) {
  function getColor(choice: string): string {
    if (!selectedChoice) return '#4FC3F7';
    if (choice === correctAnswer) return COLORS.correct;
    if (choice === selectedChoice) return COLORS.wrong;
    return '#B2BEC3';
  }

  return (
    <View style={styles.grid}>
      {choices.map((choice) => (
        <BigButton
          key={choice}
          label={choice}
          onPress={() => onSelect(choice)}
          disabled={disabled}
          color={getColor(choice)}
          style={styles.button}
          minSize={120}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  button: {
    width: '45%',
    minWidth: 130,
  },
});
