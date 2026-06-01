import { Image } from 'expo-image';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { BookingMedia, MediaCategory } from '../../store/api/mediaApi';

interface Props {
  media: BookingMedia[];
  isRTL: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 2;

const CATEGORIES = [null, ...Object.values(MediaCategory)] as (MediaCategory | null)[];

export default function PhotoGrid({ media, isRTL }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | null>(null);
  const [modalMedia, setModalMedia] = useState<BookingMedia | null>(null);

  const filtered = selectedCategory
    ? media.filter((m) => m.category === selectedCategory)
    : media;

  const getCategoryLabel = (cat: MediaCategory | null) => {
    if (!cat) return isRTL ? 'الكل' : 'All';
    return t(`booking.photos.categories.${cat}`);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (media.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={48} color="#BDBDBD" />
        <AppText style={styles.emptyText}>{t('booking.photos.noPhotos')}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat ?? 'all'}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
            ]}
          >
            <AppText
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {getCategoryLabel(cat)}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setModalMedia(item)} activeOpacity={0.85}>
            <Image
              source={{ uri: item.url }}
              style={styles.photo}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />

      <Modal
        visible={!!modalMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMedia(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalMedia(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {modalMedia && (
            <>
              <Image
                source={{ uri: modalMedia.url }}
                style={styles.modalImage}
                contentFit="contain"
              />
              <View style={styles.modalCaption}>
                {modalMedia.caption ? (
                  <AppText style={styles.captionText}>{modalMedia.caption}</AppText>
                ) : null}
                <AppText style={styles.dateText}>{formatDate(modalMedia.createdAt)}</AppText>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 13,
    color: '#757575',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  modalCaption: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
});
