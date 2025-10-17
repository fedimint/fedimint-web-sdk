import { Tabs } from 'expo-router'
import React from 'react'
import { Text } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="security"
        options={{
          title: 'Security',
          tabBarLabel: 'Security',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🔐</Text>,
        }}
      />
      <Tabs.Screen
        name="federation"
        options={{
          title: 'Federation',
          tabBarLabel: 'Federation',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🌐</Text>,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💸</Text>,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  )
}
