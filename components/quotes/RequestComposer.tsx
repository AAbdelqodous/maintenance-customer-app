import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useGetCategoriesQuery } from '../../store/api/centersApi';
import type { CreateQuoteRequest } from '../../types/quoteRequests';

interface RequestComposerProps {
  onSubmit: (data: CreateQuoteRequest) => void;
  submitting: boolean;
}

// Spec 009 US1 — compose a quote request (category + description + optional photos).
export function RequestComposer({ onSubmit, submitting }: RequestComposerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [areaGovernorate, setAreaGovernorate] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const categoryError = touched && categoryId == null;
  const descriptionError = touched && description.trim().length === 0;

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.6,
      selectionLimit: 4,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
    }
  };

  const handleSend = () => {
    setTouched(true);
    if (categoryId == null || description.trim().length === 0) return;
    onSubmit({
      categoryId,
      description: description.trim(),
      areaGovernorate: areaGovernorate.trim() || undefined,
      // NOTE: real attachment upload (→ attachmentIds) is wired with the media endpoint later;
      // the mock backend echoes ids→urls. Send positional placeholders for now.
      attachmentIds: photos.map((_, i) => i + 1),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Category */}
      <AppText style={styles.label}>{t('quoteRequests.compose.category')}</AppText>
      {categoriesLoading ? (
        <ActivityIndicator color="#2196F3" style={styles.catLoader} />
      ) : (
        <View style={styles.categoryGrid}>
          {categories?.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setCategoryId(cat.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={isRTL ? cat.nameAr : cat.nameEn}
              >
                <AppText style={styles.categoryChipIcon}>{cat.icon || '🔧'}</AppText>
                <AppText
                  style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}
                  numberOfLines={1}
                >
                  {isRTL ? cat.nameAr : cat.nameEn}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {categoryError && (
        <AppText style={styles.errorText}>{t('quoteRequests.compose.categoryRequired')}</AppText>
      )}

      {/* Description */}
      <AppText style={[styles.label, styles.labelSpaced]}>
        {t('quoteRequests.compose.describe')}
      </AppText>
      <TextInput
        style={[styles.textArea, isRTL && styles.rtlInput, descriptionError && styles.inputError]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('quoteRequests.compose.describePlaceholder')}
        placeholderTextColor="#9E9E9E"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        textAlign={isRTL ? 'right' : 'left'}
      />
      {descriptionError && (
        <AppText style={styles.errorText}>{t('quoteRequests.compose.descriptionRequired')}</AppText>
      )}

      {/* Area (optional) */}
      <AppText style={[styles.label, styles.labelSpaced]}>
        {t('quoteRequests.compose.area')}
      </AppText>
      <TextInput
        style={[styles.input, isRTL && styles.rtlInput]}
        value={areaGovernorate}
        onChangeText={setAreaGovernorate}
        placeholder="—"
        placeholderTextColor="#9E9E9E"
        textAlign={isRTL ? 'right' : 'left'}
      />

      {/* Photos (optional) */}
      <AppText style={[styles.label, styles.labelSpaced]}>
        {t('quoteRequests.compose.attach')}
      </AppText>
      <View style={styles.photosRow}>
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.photoThumb} />
        ))}
        {photos.length < 4 && (
          <TouchableOpacity style={styles.addPhoto} onPress={pickPhotos} accessibilityRole="button">
            <Ionicons name="camera-outline" size={26} color="#2196F3" />
          </TouchableOpacity>
        )}
      </View>

      <AppButton
        title={t('quoteRequests.compose.send')}
        onPress={handleSend}
        loading={submitting}
        style={styles.sendButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 10 },
  labelSpaced: { marginTop: 24 },
  catLoader: { alignSelf: 'flex-start' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipSelected: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  categoryChipIcon: { fontSize: 18 },
  categoryChipText: { fontSize: 14, color: '#1A1A2E', fontWeight: '500' },
  categoryChipTextSelected: { color: '#1565C0' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 110,
  },
  rtlInput: { writingDirection: 'rtl' },
  inputError: { borderColor: '#E53935' },
  errorText: { color: '#E53935', fontSize: 13, marginTop: 6 },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#E0E0E0' },
  addPhoto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sendButton: { marginTop: 32 },
});
