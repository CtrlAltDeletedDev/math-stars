import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  current: number;
  total: number;
  color?: string;
}

export function ProgressBar({ current, total, color = '#FFD700' }: Props) {
  const fraction = total > 0 ? current / total : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(fraction, { duration: 400 });
  }, [fraction]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={styles.label}>{current}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  track: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#fff',
    width: 40,
    textAlign: 'right',
  },
});
