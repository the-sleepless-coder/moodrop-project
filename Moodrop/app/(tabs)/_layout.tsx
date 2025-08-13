import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Home, Search, User, House, UserCircle, SearchCheck } from 'lucide-react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          backgroundColor: 'transparent',
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: '#ffffff',
            borderTopColor: 'transparent',
            borderTopWidth: 0,
          },
          default: {
            backgroundColor: '#ffffff',
            borderTopColor: 'transparent',
            borderTopWidth: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => 
            focused ? (
              <House size={size + 2} color={color} strokeWidth={2} />
            ) : (
              <Home size={size + 2} color={color} strokeWidth={1.5} />
            )
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: '향수 찾기',
          tabBarIcon: ({ color, size, focused }) => 
            focused ? (
              <SearchCheck size={size + 4} color={color} strokeWidth={2} />
            ) : (
              <Search size={size + 4} color={color} strokeWidth={1.5} />
            )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, size, focused }) => 
            focused ? (
              <UserCircle size={size + 2} color={color} strokeWidth={2} />
            ) : (
              <User size={size + 2} color={color} strokeWidth={1.5} />
            )
        }}
      />
    </Tabs>
  );
}
