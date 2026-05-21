import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  colors?: [string, string, ...string[]];
}

export function BackgroundGradient({ children, colors = ['#87CEEB', '#5BA3D9'] }: Props) {
  return (
    <LinearGradient colors={colors} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
