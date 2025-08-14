import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import CustomSplashScreen from '@/components/SplashScreen';
import notificationService from '@/services/notificationService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // 알림 권한 요청
      notificationService.requestPermissions();
    }
  }, [loaded]);

  // 폰트가 로드되지 않았으면 아무것도 렌더링하지 않음
  if (!loaded) {
    return null;
  }

  // 커스텀 스플래시 화면 표시
  if (showCustomSplash) {
    return (
      <>
        <CustomSplashScreen 
          onFinish={() => setShowCustomSplash(false)} 
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
