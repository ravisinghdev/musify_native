import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, Disc, Sparkles, UserPlus } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface NotificationItem {
  id: string;
  type: 'release' | 'artist' | 'system';
  title: string;
  description: string;
  timeAgo: string;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'release',
    title: 'New Video Premiered!',
    description: 'Astral Echo just released "Solar Flare (Official 4K Music Video)".',
    timeAgo: '12m ago',
  },
  {
    id: 'n2',
    type: 'artist',
    title: 'Cyber Pulse is on Tour',
    description: 'Cyber Pulse added new visual live tour dates in your region.',
    timeAgo: '3h ago',
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Lossless Audio Activated',
    description: 'Your account is now streaming 24-bit / 96kHz master tracks.',
    timeAgo: '1d ago',
  },
];

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'release':
        return <Disc size={18} color={colors.primary} />;
      case 'artist':
        return <UserPlus size={18} color={colors.primary} />;
      default:
        return <Sparkles size={18} color={colors.primary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              {getIcon(item.type)}
            </View>
            <View style={styles.contentWrapper}>
              <View style={styles.cardTopRow}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{item.timeAgo}</Text>
              </View>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});

