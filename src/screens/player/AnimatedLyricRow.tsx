import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedLyricRowProps {
  lineText: string;
  isCurrentLine: boolean;
  activeColor: string;
  onPress: () => void;
}

export const AnimatedLyricRow: React.FC<AnimatedLyricRowProps> = ({
  lineText,
  isCurrentLine,
  activeColor,
  onPress,
}) => {
  const scale = useSharedValue(isCurrentLine ? 1.08 : 0.98);
  const opacity = useSharedValue(isCurrentLine ? 1 : 0.45);

  useEffect(() => {
    scale.value = withSpring(isCurrentLine ? 1.08 : 0.98, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
    opacity.value = withSpring(isCurrentLine ? 1 : 0.45, {
      damping: 20,
      stiffness: 200,
    });
  }, [isCurrentLine]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.touchableWrap}
    >
      <Animated.View style={[styles.rowContainer, animatedStyle]}>
        <Animated.Text
          style={[
            styles.baseText,
            isCurrentLine ? [
              styles.activeText,
              {
                color: activeColor,
                textShadowColor: activeColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 16,
              },
            ] : styles.inactiveText,
          ]}
        >
          {lineText}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableWrap: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  baseText: {
    textAlign: 'center',
    lineHeight: 28,
  },
  activeText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  inactiveText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(220, 225, 235, 0.45)',
  },
});

