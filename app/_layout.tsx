import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StyleSheet, View, Text } from 'react-native';
import { ProgressProvider } from '@/store/useProgress';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>⭐</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ProgressProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: 64 },
});
