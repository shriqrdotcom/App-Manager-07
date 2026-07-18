import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { MenuItem, MenuCategory } from '@/types/menu';

interface Props {
  item: MenuItem;
  category: MenuCategory | undefined;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function MenuItemCard({ item, category }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Image or placeholder */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.image, { backgroundColor: colors.muted }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="image" size={22} color={colors.mutedForeground} />
        </View>
      )}

      {/* Details */}
      <View style={styles.content}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.isVegetarian && (
            <View
              style={[
                styles.vegBadge,
                { backgroundColor: '#16a34a' + '1A', borderColor: '#16a34a' + '33' },
              ]}
            >
              <Text style={[styles.vegText, { color: '#16a34a' }]}>VEG</Text>
            </View>
          )}
        </View>

        {/* Category and price */}
        <View style={styles.metaRow}>
          {category && (
            <Text style={[styles.category, { color: colors.mutedForeground }]}>
              {category.name}
            </Text>
          )}
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(item.price)}
          </Text>
        </View>

        {/* Status badges */}
        <View style={styles.badgeRow}>
          <StatusBadge
            label={item.isAvailable ? 'Available' : 'Unavailable'}
            active={item.isAvailable}
            activeColor="#16a34a"
            inactiveColor={colors.mutedForeground}
            colors={colors}
          />
          <StatusBadge
            label={item.isPublished ? 'Published' : 'Draft'}
            active={item.isPublished}
            activeColor={colors.primary}
            inactiveColor={colors.mutedForeground}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

interface BadgeProps {
  label: string;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  colors: ReturnType<typeof useColors>;
}

function StatusBadge({
  label,
  active,
  activeColor,
  inactiveColor,
  colors,
}: BadgeProps) {
  const textColor = active ? activeColor : inactiveColor;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: textColor + '1A',
          borderColor: textColor + '33',
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: {
    width: 90,
    alignSelf: 'stretch',
  },
  imagePlaceholder: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  vegBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  vegText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  category: {
    fontSize: 12,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
