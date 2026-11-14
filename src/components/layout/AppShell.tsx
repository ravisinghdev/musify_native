import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MiniPlayer } from '../player/MiniPlayer';
import { useThemeStore } from '../../store/useThemeStore';

interface AppShellProps {
  children: React.ReactNode;
  showMiniPlayer?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showMiniPlayer = true }) => {
  const { colors } = useThemeStore();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View style={styles.content}>{children}</View>
      {showMiniPlayer && <MiniPlayer />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
