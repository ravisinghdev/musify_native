import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Moon, Check, X, Clock } from 'lucide-react-native';
import { useSleepTimerStore, SleepTimerOption } from '../../store/useSleepTimerStore';
import { useThemeStore } from '../../store/useThemeStore';
import { hapticFeedback } from '../../utils/haptics';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useThemeStore();
  const {
    isActive,
    selectedOption,
    remainingSeconds,
    setTimer,
    cancelTimer,
  } = useSleepTimerStore();

  const options: { label: string; value: SleepTimerOption; sub?: string }[] = [
    { label: '5 Minutes', value: 5 },
    { label: '10 Minutes', value: 10 },
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '45 Minutes', value: 45 },
    { label: '1 Hour', value: 60 },
    { label: 'End of Current Track', value: 'end_of_track', sub: 'Fades at song conclusion' },
  ];

  const formatRemaining = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.glassContainer}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassPlateWash} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { borderColor: colors.primary }]}>
                <Moon size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.titleText}>Sleep Timer</Text>
                <Text style={styles.subtitleText}>
                  {isActive
                    ? `Stopping in ${formatRemaining(remainingSeconds)}`
                    : 'Gently fades out and stops playback'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Options Grid / List */}
          <View style={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = isActive && selectedOption === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  activeOpacity={0.8}
                  onPress={() => {
                    hapticFeedback.selection();
                    setTimer(opt.value);
                    onClose();
                  }}
                  style={[
                    styles.optionRow,
                    isSelected && [
                      styles.optionRowActive,
                      { borderColor: colors.primary, backgroundColor: 'rgba(255,255,255,0.12)' },
                    ],
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && { color: colors.primary, fontWeight: '800' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.sub && (
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    )}
                  </View>

                  {isSelected && (
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel Active Timer Button */}
          {isActive && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.medium();
                cancelTimer();
                onClose();
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Turn Off Sleep Timer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  glassContainer: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    padding: 22,
    backgroundColor: 'rgba(20, 22, 28, 0.85)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  glassPlateWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  optionRowActive: {
    borderWidth: 1.2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
