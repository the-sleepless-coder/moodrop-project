import { Stack } from 'expo-router';
import React from 'react';

export default function CategoryLayout() {
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
          title: '무드 선택',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="recommendation"
        options={{
          title: '추천 향수',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: '향수 정보',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          title: '향수 레시피',
          headerShown: true,
        }}
      />
    </Stack>
  );
}