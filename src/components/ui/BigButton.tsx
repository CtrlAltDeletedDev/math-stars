import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  onPress: () => void;
  label: string;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  minSize?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BigButton({ onPress, label, color = '#4FC3F7', textColor = '#fff', disabled, style, textStyle, minSize = 120 }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.93, { damping: 10, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 10, stiffness: 300 });
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: color, minWidth: minSize, minHeight: minSize },
        style,
        animStyle,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
