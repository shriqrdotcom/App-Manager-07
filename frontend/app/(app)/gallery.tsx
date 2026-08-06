import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useApp } from '@/src/providers/AppProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { menuApi } from '@/src/api/menu';
import type { MenuGalleryImage, MenuItem } from '@/src/types/menu';
import { imageAssetToDataUrl } from '@/src/utils/image-data';

type PickerAsset = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

type GalleryAction =
  | { type: 'add'; position: number }
  | { type: 'replace-cover' };

const MAX_GALLERY_IMAGES = 20;

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorBanner} testID="gallery-error">
      <Feather name="wifi-off" size={16} color="#FCA5A5" />
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" testID="gallery-retry">
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function ImageRow({
  image,
  position,
  onDelete,
  busy,
}: {
  image: MenuGalleryImage;
  position: number;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.imageRow} testID={`gallery-image-${image.id}`}>
      <Image
        source={{ uri: image.url }}
        style={styles.image}
        contentFit="cover"
        accessibilityLabel={image.altText || `Menu image ${position}`}
      />
      <View style={styles.imageInfo}>
        <Text style={styles.imageTitle}>Image {position}</Text>
        <Text style={styles.imageId} numberOfLines={1}>{image.altText || 'Menu item gallery image'}</Text>
      </View>
      <Pressable
        onPress={onDelete}
        disabled={busy}
        style={[styles.iconButton, styles.deleteButton]}
        accessibilityRole="button"
        accessibilityLabel={`Delete image ${position}`}
        testID={`gallery-delete-${image.id}`}
      >
        <Feather name="trash-2" size={16} color="#FCA5A5" />
      </Pressable>
    </View>
  );
}

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedRestaurant } = useApp();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const itemId = typeof params.itemId === 'string' ? params.itemId : undefined;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(Boolean(itemId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadItem = useCallback(async (pullToRefresh = false) => {
    if (!itemId || !selectedRestaurant) return;
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await menuApi.getItem(selectedRestaurant.uid, itemId);
      setItem(response.item);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this item gallery.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemId, selectedRestaurant]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const pickImage = useCallback(async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      selectionLimit: 1,
      quality: 1,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return imageAssetToDataUrl(result.assets[0] as PickerAsset);
  }, []);

  const runImageAction = useCallback(async (action: GalleryAction) => {
    if (!selectedRestaurant || !itemId || busy) return;
    const previousItem = item;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await pickImage();
      if (!dataUrl) return;

      if (action.type === 'add') {
        await menuApi.addGallery(selectedRestaurant.uid, itemId, dataUrl, {
          altText: item?.name || 'Menu item image',
          position: action.position,
        });
      } else {
        await menuApi.replaceImage(selectedRestaurant.uid, itemId, dataUrl, 'horizontal');
      }

      await loadItem(true);
    } catch (mutationError) {
      setItem(previousItem);
      setError(mutationError instanceof Error ? mutationError.message : 'Image update failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }, [busy, item, itemId, loadItem, pickImage, selectedRestaurant]);

  const deleteImage = useCallback(async (galleryId: string) => {
    if (!selectedRestaurant || busy) return;
    const previousItem = item;
    setBusy(true);
    setError(null);
    try {
      await menuApi.deleteGallery(selectedRestaurant.uid, galleryId);
      await loadItem(true);
    } catch (deleteError) {
      setItem(previousItem);
      setError(deleteError instanceof Error ? deleteError.message : 'Image deletion failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }, [busy, item, loadItem, selectedRestaurant]);

  const gallery = useMemo(() => item?.gallery ?? [], [item]);
  const canAdd = gallery.length < MAX_GALLERY_IMAGES;

  if (!itemId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="image" size={30} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Select a menu item first</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Gallery management is available from a specific menu item.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.primaryButton} testID="gallery-go-back">
          <Text style={styles.primaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>Item Gallery</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item?.name || 'Loading menu item…'}
          </Text>
        </View>
        <Pressable
          onPress={() => void loadItem(true)}
          disabled={refreshing || busy}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh gallery"
          testID="gallery-refresh"
        >
          <Feather name="refresh-cw" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void loadItem()} /> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading images…</Text>
        </View>
      ) : (
        <FlatList
          testID="gallery-list"
          data={gallery}
          keyExtractor={(image) => image.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadItem(true)}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {gallery.length} {gallery.length === 1 ? 'image' : 'images'}
              </Text>
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Uploads are saved to this menu item.
              </Text>
              {item?.image ? (
                <View style={styles.coverCard}>
                  <Image source={{ uri: item.image.url }} style={styles.coverImage} contentFit="cover" />
                  <View style={styles.coverCopy}>
                    <Text style={styles.coverLabel}>Cover image</Text>
                    <Pressable
                      onPress={() => void runImageAction({ type: 'replace-cover' })}
                      disabled={busy}
                      style={styles.replaceCoverButton}
                      testID="gallery-replace-cover"
                    >
                      <Text style={styles.replaceCoverText}>{busy ? 'Updating…' : 'Replace cover'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {canAdd ? (
                <Pressable
                  onPress={() => void runImageAction({ type: 'add', position: gallery.length })}
                  disabled={busy}
                  style={styles.addButton}
                  accessibilityRole="button"
                  accessibilityLabel="Upload gallery image"
                  testID="gallery-upload"
                >
                  {busy ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="upload" size={17} color="#FFFFFF" />}
                  <Text style={styles.addButtonText}>{busy ? 'Uploading…' : 'Upload image'}</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item: image, index }) => (
            <ImageRow
              image={image}
              position={index + 1}
              onDelete={() => void deleteImage(image.id)}
              busy={busy}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Feather name="image" size={24} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No gallery images</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Upload the first image for this menu item.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242427',
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { marginTop: 3, fontSize: 12 },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242427',
  },
  list: { padding: 18, gap: 12 },
  listHeader: { gap: 10, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  helperText: { fontSize: 12 },
  coverCard: {
    minHeight: 100,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#242427',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#35353A',
  },
  coverImage: { width: 110, minHeight: 100 },
  coverCopy: { flex: 1, padding: 14, justifyContent: 'center', gap: 9 },
  coverLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  replaceCoverButton: { alignSelf: 'flex-start' },
  replaceCoverText: { color: '#93C5FD', fontSize: 12, fontWeight: '700' },
  addButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  imageRow: {
    minHeight: 82,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242427',
    borderWidth: 1,
    borderColor: '#35353A',
  },
  image: { width: 62, height: 62, borderRadius: 9, backgroundColor: '#35353A' },
  imageInfo: { flex: 1, minWidth: 0 },
  imageTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  imageId: { color: '#A1A1AA', fontSize: 11, marginTop: 4 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35353A',
  },
  deleteButton: { backgroundColor: '#4A272B' },
  errorBanner: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#571F26',
  },
  errorText: { color: '#FECACA', fontSize: 12, flex: 1 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  emptyCard: { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 12, textAlign: 'center', maxWidth: 280 },
  primaryButton: { marginTop: 8, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#0A84FF' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
});