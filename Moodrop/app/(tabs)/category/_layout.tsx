import { Stack } from 'expo-router';
import React from 'react';

export default function CategoryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '향수 카테고리',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#171717',
          },
          headerTintColor: '#171717',
        }}
      />
      <Stack.Screen
        name="subcategory"
        options={{
          title: '세부 카테고리',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#171717',
          },
          headerTintColor: '#171717',
        }}
      />
      <Stack.Screen
        name="recommendation"
        options={{
          title: '추천 향수',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#171717',
          },
          headerTintColor: '#171717',
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: '향수 정보',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#171717',
          },
          headerTintColor: '#171717',
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          title: '향수 레시피',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#171717',
          },
          headerTintColor: '#171717',
        }}
      />
    </Stack>
  );
}