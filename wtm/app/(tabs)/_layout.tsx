import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useUnreadCount } from '@/hooks/useActivity';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Ionicons
      name={(focused ? name : `${name}-outline`) as 'flame' | 'flame-outline'}
      size={24}
      color={focused ? '#FF6B35' : '#606060'}
    />
  );
}

function ActivityIcon({ focused }: { focused: boolean }) {
  const { data: unread = 0 } = useUnreadCount();
  return (
    <View>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={24}
        color={focused ? '#FF6B35' : '#606060'}
      />
      {unread > 0 && (
        <View style={{
          position: 'absolute', top: -3, right: -6,
          backgroundColor: '#FF6B35',
          borderRadius: 8, minWidth: 16, height: 16,
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
          borderWidth: 1.5, borderColor: '#0A0A0A',
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </View>
  );
}

function CreateIcon() {
  return (
    <View style={{
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: '#FF6B35',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 24,
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <Ionicons name="add" size={28} color="#fff" />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => { Haptics.selectionAsync(); },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0D0D0D',
          borderTopColor: '#1E1E1E',
          borderTopWidth: 0.5,
          elevation: 0,
          height: 80,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios'
            ? <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
            : null,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#606060',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon name="flame" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => <CreateIcon />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => <ActivityIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
    </Tabs>
  );
}
