import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#171717',
        },
        headerTintColor: '#171717',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '마이페이지',
          headerShown: false, // 탭에서 관리하므로 헤더 숨김
        }}
      />
      <Stack.Screen
        name="device-settings"
        options={{
          title: '기기 설정',
          headerShown: true,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ingredient-settings"
        options={{
          title: '원료 설정',
          headerShown: true,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="my-recipes"
        options={{
          title: '나만의 레시피',
          headerShown: true,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}