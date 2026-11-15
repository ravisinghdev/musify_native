import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomGlassTabBar } from './CustomGlassTabBar';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { FullPlayerModal } from '../screens/player/FullPlayerModal';
import { VideoPlayerScreen } from '../screens/player/VideoPlayerScreen';
import { PremiumSubscriptionScreen } from '../screens/hubs/PremiumSubscriptionScreen';
import { NotificationCenterScreen } from '../screens/hubs/NotificationCenterScreen';
import { DetailScreen } from '../screens/details/DetailScreen';
import { EqualizerModal } from '../screens/player/EqualizerModal';
import { IntroTourScreen } from '../screens/auth/IntroTourScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { RootStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="LibraryTab" component={LibraryScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="IntroTour"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 180,
      }}
    >
      <Stack.Screen
        name="IntroTour"
        component={IntroTourScreen}
        options={{
          animation: 'fade',
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="AuthScreen"
        component={AuthScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          animation: 'fade',
          animationDuration: 180,
        }}
      />
      <Stack.Screen
        name="FullPlayerModal"
        component={FullPlayerModal}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="EqualizerModal"
        component={EqualizerModal}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="VideoPlayerScreen"
        component={VideoPlayerScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          animationDuration: 180,
        }}
      />
      <Stack.Screen
        name="PlaylistDetails"
        children={() => <DetailScreen type="playlist" />}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="ArtistProfile"
        children={() => <DetailScreen type="artist" />}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="AlbumDetails"
        children={() => <DetailScreen type="album" />}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="AudioQualitySettings"
        children={() => <DetailScreen type="audio-quality" />}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="StorageCacheSettings"
        children={() => <DetailScreen type="storage" />}
        options={{ animation: 'slide_from_right', animationDuration: 180 }}
      />
      <Stack.Screen
        name="PremiumSubscription"
        component={PremiumSubscriptionScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 180,
        }}
      />
    </Stack.Navigator>
  );
};
