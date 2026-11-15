import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Home, Search, Library, Settings } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { hapticFeedback } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 20;
const DOCK_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
const TAB_COUNT = 4;
const TAB_SLOT_WIDTH = DOCK_WIDTH / TAB_COUNT;
const PILL_WIDTH = TAB_SLOT_WIDTH - 6;
const PILL_HEIGHT = 42;

const TAB_ICONS = [Home, Search, Library, Settings];

export const CustomGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { colors } = useThemeStore();
  const currentIndex = state.index;

  // ColorOS 17 Physics Animation Values
  const translateX = useSharedValue(currentIndex * TAB_SLOT_WIDTH + 3);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const gestureVelocityX = useSharedValue(0);

  // Sync pill position on route switch with ColorOS spring dynamics
  useEffect(() => {
    translateX.value = withSpring(currentIndex * TAB_SLOT_WIDTH + 3, {
      damping: 24,
      stiffness: 280,
      mass: 0.6,
    });
  }, [currentIndex]);

  const onTabSelect = (index: number) => {
    if (index === state.index) return;
    hapticFeedback.selection();
    const route = state.routes[index];
    navigation.navigate(route.name);
  };

  const handleDragRelease = (targetIndex: number) => {
    hapticFeedback.medium();
    const route = state.routes[targetIndex];
    if (route) {
      navigation.navigate(route.name);
    }
  };

  // ColorOS 17 Gesture Handler: direct finger tracking + horizontal velocity inertia + fluid pop-out
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      runOnJS(hapticFeedback.light)();
    })
    .onUpdate((event) => {
      // Allow pill to slide past the dock edges fluidly
      const minX = -28;
      const maxX = (TAB_COUNT - 1) * TAB_SLOT_WIDTH + 34;
      const targetX = currentIndex * TAB_SLOT_WIDTH + 3 + event.translationX;
      translateX.value = Math.max(minX, Math.min(maxX, targetX));
      gestureVelocityX.value = event.velocityX;

      // ColorOS 17 Fluid Elasticity & Dramatic Pop-Out:
      // While dragging, zoom/scale up significantly so it visibly pops and expands out of the bottom nav capsule
      const absSpeed = Math.min(Math.abs(event.velocityX), 1500);
      const stretch = 1.34 + (absSpeed / 1500) * 0.22; // 1.34x up to 1.56x horizontal expansion
      const verticalPop = 1.48; // 46px * 1.48 = 68px tall! Dramatically extends outside the 56px dock boundary
      scaleX.value = withSpring(stretch, { damping: 14, stiffness: 300 });
      scaleY.value = withSpring(verticalPop, { damping: 14, stiffness: 300 });
    })
    .onEnd((event) => {
      isDragging.value = false;
      // Velocity-aware flick detection
      let predictedX = translateX.value + event.velocityX * 0.12;
      const nearestIndex = Math.round((predictedX - 3) / TAB_SLOT_WIDTH);
      const clampedIndex = Math.max(0, Math.min(TAB_COUNT - 1, nearestIndex));

      // Settle spring animation back into the tab dock
      translateX.value = withSpring(clampedIndex * TAB_SLOT_WIDTH + 3, {
        velocity: event.velocityX,
        damping: 18,
        stiffness: 240,
        mass: 0.5,
      });

      // Spring smoothly back from the popped-out state to neutral 1.0
      scaleX.value = withSpring(1, { damping: 16, stiffness: 240 });
      scaleY.value = withSpring(1, { damping: 16, stiffness: 240 });

      runOnJS(handleDragRelease)(clampedIndex);
    });

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
      zIndex: isDragging.value ? 100 : 5,
    };
  });

  return (
    <View style={styles.dockOuterWrapper} pointerEvents="box-none">
      {/* Translucent Floating Dock Capsule (Entirely free of solid backgrounds) */}
      <View style={styles.dockBackdropPlate}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dockWaterTint} />
      </View>

      <View style={styles.dockInnerContainer} pointerEvents="box-none">
        {/* ColorOS 17 Elastic Glowing Active Pill Capsule */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.activePillCapsule,
              animatedPillStyle,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                borderColor: 'rgba(255, 255, 255, 0.38)',
              },
            ]}
          >
            {/* ColorOS 17 Contour Glow Aura - Dynamically tinted by active accent */}
            <View
              style={[
                styles.pillInnerGlow,
                {
                  backgroundColor: colors.primary,
                  opacity: 0.35,
                },
              ]}
            />
          </Animated.View>
        </GestureDetector>

        {/* Tab Items Row with Dynamic Distance-Based Light & Scale Scaling */}
        <View style={styles.tabSlotsRow} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = TAB_ICONS[index] || Home;

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.82}
                onPress={() => onTabSelect(index)}
                style={styles.tabSlot}
              >
                <Icon
                  size={24}
                  color={isFocused ? colors.primary : 'rgba(255, 255, 255, 0.55)'}
                  strokeWidth={isFocused ? 2.6 : 2}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockOuterWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 90,
  },
  dockBackdropPlate: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  dockWaterTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
  },
  dockInnerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  activePillCapsule: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: 21,
    borderWidth: 1.2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B8C0CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pillInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 21,
  },
  tabSlotsRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
