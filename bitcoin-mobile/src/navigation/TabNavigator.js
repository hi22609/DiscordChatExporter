import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen }      from '../screens/HomeScreen';
import { ChartScreen }     from '../screens/ChartScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { AlertsScreen }    from '../screens/AlertsScreen';
import { COLORS } from '../utils/theme';

const Tab = createBottomTabNavigator();

function icon(name, focused) {
  const icons = { Cycle: '₿', Chart: '📈', Portfolio: '💼', Alerts: '🔔' };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{icons[name]}</Text>;
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => icon(route.name, focused),
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: 'rgba(10,10,15,0.97)',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Cycle"     component={HomeScreen} />
      <Tab.Screen name="Chart"     component={ChartScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Alerts"    component={AlertsScreen} />
    </Tab.Navigator>
  );
}
