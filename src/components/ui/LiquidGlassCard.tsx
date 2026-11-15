import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { LIQUID_GLASS } from '../../constants/liquidGlass';

interface LiquidGlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: BlurTint;
  borderRadius?: number;
  borderOpacity?: number;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  intensity = Platform.OS === 'ios' ? 85 : 95,
  tint = 'light',
  borderRadius = 24,
  borderOpacity = 0.32,
}) => {
  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        },
        style,
      ]}
    >
      {/* 1. Underlying Frosted Blur Plate */}
      <View style={[styles.blurWrapper, { borderRadius }]}>
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        {/* Liquid crystal reflection tint */}
        <View style={styles.liquidTint} />
      </View>

      {/* 2. Child Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.2,
    shadowColor: LIQUID_GLASS.shadow.floating.shadowColor,
    shadowOffset: LIQUID_GLASS.shadow.floating.shadowOffset,
    shadowOpacity: LIQUID_GLASS.shadow.floating.shadowOpacity,
    shadowRadius: LIQUID_GLASS.shadow.floating.shadowRadius,
    elevation: LIQUID_GLASS.shadow.floating.elevation,
  },
  blurWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  liquidTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
});
