import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useRouter, useSegments } from 'expo-router';

// Icons (using text emojis for simplicity - replace with icon library if desired)
const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconFocused]}>
    <View style={styles.icon}>{name}</View>
  </View>
);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#60A5FA',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#0F172A',
            borderTopColor: '#1E293B',
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: '#F1F5F9',
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => <TabBarIcon name="📅" focused={focused} />,
            headerTitle: 'Today',
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ focused }) => <TabBarIcon name="✓" focused={focused} />,
            headerTitle: 'All Tasks',
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Standards',
            tabBarIcon: ({ focused }) => <TabBarIcon name="⭐" focused={focused} />,
            headerTitle: 'Standards',
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: 'Training',
            tabBarIcon: ({ focused }) => <TabBarIcon name="💪" focused={focused} />,
            headerTitle: 'Training',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => <TabBarIcon name="⚙️" focused={focused} />,
            headerTitle: 'Settings',
          }}
        />
        <Tabs.Screen
          name="auth"
          options={{
            href: null, // Hide from tabs
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    backgroundColor: '#1E3A8A',
  },
  icon: {
    fontSize: 24,
  },
});
