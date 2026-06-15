import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TabNavigator } from './src/navigation/TabNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary:    '#f7931a',
              background: '#0a0a0f',
              card:       '#111118',
              text:       '#e8e8f0',
              border:     '#1e1e2e',
              notification: '#f7931a',
            },
          }}
        >
          <StatusBar style="light" backgroundColor="#0a0a0f" />
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
