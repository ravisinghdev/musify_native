import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, Library, Settings } from 'lucide-react-native';

import { useThemeStore } from '../store/useThemeStore';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { FullPlayerModal } from '../screens/player/FullPlayerModal';
import { VideoPlayerScreen } from '../screens/player/VideoPlayerScreen';
import { PremiumSubscriptionScreen } from '../screens/hubs/PremiumSubscriptionScreen';
import { NotificationCenterScreen } from '../screens/hubs/NotificationCenterScreen';
import { DetailScreen } from '../screens/details/DetailScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { RootStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabNavigator = () => {
  const { colors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      
      {/* Media Playback Modals & Screens */}
      <Stack.Screen
        name="FullPlayerModal"
        component={FullPlayerModal}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="VideoPlayerScreen"
        component={VideoPlayerScreen}
        options={{
          animation: 'fade',
        }}
      />

      {/* Hubs & Centers */}
      <Stack.Screen name="PremiumSubscription" component={PremiumSubscriptionScreen} />
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />

      {/* Detail Pages */}
      <Stack.Screen name="PlaylistDetails">
        {() => <DetailScreen type="playlist" />}
      </Stack.Screen>
      <Stack.Screen name="ArtistProfile">
        {() => <DetailScreen type="artist" />}
      </Stack.Screen>
      <Stack.Screen name="AlbumDetails">
        {() => <DetailScreen type="album" />}
      </Stack.Screen>
      <Stack.Screen name="UserProfile">
        {() => <DetailScreen type="profile" />}
      </Stack.Screen>
      <Stack.Screen name="AudioQualitySettings">
        {() => <DetailScreen type="audio-quality" />}
      </Stack.Screen>
      <Stack.Screen name="StorageCacheSettings">
        {() => <DetailScreen type="storage" />}
      </Stack.Screen>

      {/* Auth Flow */}
      <Stack.Screen name="AuthStack">
        {() => <AuthScreen mode="login" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

