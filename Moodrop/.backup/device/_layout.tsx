import { Stack } from 'expo-router';

export default function DeviceLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="ingredient-settings" 
        options={{ 
          title: '원료 설정',
          headerBackTitle: '뒤로',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#171717',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
    </Stack>
  );
}