import React from 'react';
import { ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { hapticFeedback } from '../../utils/haptics';

interface GlassPressableProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'selection' | 'none';
  disabled?: boolean;
}

export const GlassPressable: React.FC<GlassPressableProps> = ({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  haptic = 'light',
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(scaleTo, {
      damping: 15,
      stiffness: 400,
      mass: 0.4,
    });
    opacity.value = withSpring(0.92, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 350,
      mass: 0.4,
    });
    opacity.value = withSpring(1, {
      damping: 14,
      stiffness: 350,
    });
  };

  const triggerHaptic = () => {
    if (haptic === 'light') hapticFeedback.light();
    else if (haptic === 'medium') hapticFeedback.medium();
    else if (haptic === 'selection') hapticFeedback.selection();
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={(e) => {
        triggerHaptic();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};

