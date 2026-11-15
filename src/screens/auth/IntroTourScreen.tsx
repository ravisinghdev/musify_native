import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Sparkles,
  Music,
  Headphones,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Disc3,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { hapticFeedback } from '../../utils/haptics';
import { supabase } from '../../services/supabase/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IntroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  artwork: any;
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: 'welcome',
    badge: 'UNLIMITED STREAMING',
    title: 'Pure Sound.\nZero Restrictions.',
    subtitle:
      'Experience 320 kbps high-fidelity playback, integrated offline library scanning, and silky gapless transitions with zero interruptions.',
    icon: Headphones,
    artwork: require('../../../assets/tour/tour_streaming.jpg'),
  },
  {
    id: 'dsp',
    badge: 'PRECISION DSP ACOUSTICS',
    title: '10-Band Studio Equalizer & Synced Lyrics',
    subtitle:
      'Fine-tune sub-bass to air frequencies, apply hardware-modeled acoustic curves, and follow floating real-time karaoke lyrics.',
    icon: Sliders,
    artwork: require('../../../assets/tour/tour_equalizer.jpg'),
  },
  {
    id: 'ai_db',
    badge: 'SUPABASE CLOUD & AI',
    title: 'Decentralized Sync &\nNatural AI Discovery',
    subtitle:
      'Store your favorite collections safely in encrypted PostgreSQL cloud tables and discover deep cuts using conversational mood prompts.',
    icon: Sparkles,
    artwork: require('../../../assets/tour/tour_ai.jpg'),
  },
];

export const IntroTourScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animated Floating Motion
  const floatingCardY = useSharedValue(0);

  useEffect(() => {
    floatingCardY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 3200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedFloatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingCardY.value }],
  }));

  // Auto-bypass tour if user already has an active Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    });
  }, []);

  const isLast = currentSlideIndex === INTRO_SLIDES.length - 1;
  const currentSlide = INTRO_SLIDES[currentSlideIndex];

  const handleNext = () => {
    hapticFeedback.light();
    if (isLast) {
      navigation.navigate('AuthScreen');
    } else {
      const nextIndex = currentSlideIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    hapticFeedback.medium();
    navigation.navigate('AuthScreen');
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentSlideIndex && newIndex >= 0 && newIndex < INTRO_SLIDES.length) {
      hapticFeedback.selection();
      setCurrentSlideIndex(newIndex);
    }
  };

  const renderSlide = ({ item }: { item: IntroSlide }) => {
    const IconComponent = item.icon;
    return (
      <View style={styles.slidePageContainer}>
        {/* Monochromatic 3D Card with Subtle Frosted Border */}
        <Animated.View style={[styles.heroCardOuterWrap, animatedFloatingStyle]}>
          <View style={styles.heroCardGlassFrame}>
            <Image
              source={item.artwork}
              style={styles.heroArtwork}
              resizeMode="cover"
            />
            {/* Minimal frosted bottom tag */}
            <BlurView intensity={45} tint="dark" style={styles.cardBottomGlassPlate}>
              <View style={styles.cardPillRow}>
                <View style={styles.glassMiniBadge}>
                  <IconComponent size={13} color="#FFFFFF" />
                  <Text style={styles.glassMiniBadgeText}>MUSIFY STUDIO</Text>
                </View>
                <Disc3 size={16} color="rgba(255, 255, 255, 0.7)" />
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Minimal White Badge */}
        <View style={styles.featurePill}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pillGlassWash} />
          <View style={styles.pillAccentDot} />
          <Text style={styles.featurePillText}>{item.badge}</Text>
        </View>

        {/* Clean Typography */}
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* 1. Deep OLED Backdrop with Frosted Veil */}
      <View style={styles.backgroundLayer}>
        <Image
          source={currentSlide.artwork}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.darkGradientOverlay} />
      </View>

      {/* 2. Top Header with Soundwave Logo */}
      <View style={styles.topNav}>
        <View style={styles.brandGlassBadge}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.brandBadgeWash} />
          <Image
            source={require('../../../assets/musify_logo.png')}
            style={styles.brandAppIcon}
            resizeMode="contain"
          />
          <Text style={styles.brandBadgeText}>MUSIFY</Text>
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Swipable Carousel */}
      <FlatList
        ref={flatListRef}
        data={INTRO_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ alignItems: 'center' }}
        style={styles.carouselList}
      />

      {/* 4. Bottom Controls */}
      <View style={styles.bottomSection}>
        {/* Minimal Dots */}
        <View style={styles.dotsRow}>
          {INTRO_SLIDES.map((_, idx) => {
            const isSelected = idx === currentSlideIndex;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                  setCurrentSlideIndex(idx);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.dot,
                    isSelected ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Minimalist Pure White Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleNext}
          style={styles.primaryActionBtn}
        >
          <Text style={styles.actionBtnText}>
            {isLast ? 'Enter Musify' : 'Continue'}
          </Text>
          <ChevronRight size={18} color="#000000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    zIndex: 10,
  },
  brandGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  brandAppIcon: {
    width: 22,
    height: 22,
  },
  brandBadgeWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.6,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    fontSize: 13,
  },
  carouselList: {
    flexGrow: 0,
    zIndex: 5,
  },
  slidePageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 26,
    justifyContent: 'center',
  },
  heroCardOuterWrap: {
    width: SCREEN_WIDTH * 0.68,
    height: SCREEN_WIDTH * 0.68,
    marginBottom: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 26,
    elevation: 14,
  },
  heroCardGlassFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
    backgroundColor: '#0A0A0C',
  },
  heroArtwork: {
    width: '100%',
    height: '100%',
  },
  cardBottomGlassPlate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glassMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  pillGlassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryActionBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF', // High-contrast pure white pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000', // Crisp black text on pure white button
    letterSpacing: 0.2,
  },
});
