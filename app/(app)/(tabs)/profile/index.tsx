import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { useAuth } from '../../../../hooks/useAuth';
import { API_BASE_URL } from '../../../../lib/constants/config';
import { useAppSelector } from '../../../../store';
import { useChangePasswordMutation, useDeleteAccountMutation, useGetMyProfileQuery, useUpdateProfileMutation, useUploadProfileImageMutation } from '../../../../store/api/profileApi';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const isRTL = i18n.dir() === 'rtl';

  const { user } = useAppSelector((state) => state.auth);

  const { data: profile, isLoading: profileLoading, refetch } = useGetMyProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteAccountMutation();
  const [uploadProfileImage, { isLoading: uploading }] = useUploadProfileImageMutation();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const [editForm, setEditForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    dateOfBirth: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        firstname: profile.firstname,
        lastname: profile.lastname,
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
      });
      setShowEditProfile(true);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('profile.photoPermissionTitle'), t('profile.photoPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Show picked image immediately — don't wait for the server round-trip
      setLocalImageUri(asset.uri);

      const formData = new FormData();
      // On web, expo-image-picker provides a real File object in asset.file.
      // On native, we must use the {uri, name, type} object form.
      if ((asset as any).file) {
        formData.append('file', (asset as any).file, asset.fileName ?? 'profile.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName ?? 'profile.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        } as any);
      }

      try {
        await uploadProfileImage(formData).unwrap();
        setImageTimestamp(Date.now());
        Alert.alert(t('common.success'), t('profile.photoUpdated'));
      } catch (error) {
        setLocalImageUri(null); // revert optimistic preview on failure
        Alert.alert(t('common.error'), t('errors.serverError'));
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        firstname: editForm.firstname,
        lastname: editForm.lastname,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
      }).unwrap();
      setShowEditProfile(false);
      Alert.alert(t('common.success'), t('profile.save'));
      refetch();
    } catch (error) {
      Alert.alert(t('common.error'), t('common.retry'));
    }
  };

  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowChangePassword(true);
  };

  const handleSubmitPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert(t('common.error'), t('errors.passwordTooShort'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert(t('common.error'), t('errors.passwordTooShort'));
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }).unwrap();
      setShowChangePassword(false);
      Alert.alert(t('common.success'), t('profile.changePassword'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.retry'));
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.logoutConfirm'))) logout();
      return;
    }
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              logout();
            } catch (error) {
              Alert.alert(t('common.error'), t('common.retry'));
            }
          },
        },
      ]
    );
  };

  const handleNavigateTo = (route: string) => {
    router.push(route);
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <AppText>{t('common.loading')}</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploading} style={styles.avatarTouchable}>
            {(localImageUri ?? profile?.profileImageUrl) ? (
              <Image
                source={{
                  uri: localImageUri
                    ?? `${profile!.profileImageUrl!.startsWith('http') ? profile!.profileImageUrl! : `${API_BASE_URL.replace('/api/v1', '')}${profile!.profileImageUrl}`}?t=${imageTimestamp}`,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AppText style={styles.avatarText}>
                  {profile?.firstname?.charAt(0)?.toUpperCase() ?? '?'}
                </AppText>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerInfo}>
          <AppText style={styles.name}>
            {profile?.firstname || user?.firstname} {profile?.lastname || user?.lastname}
          </AppText>
          <AppText style={styles.email}>{profile?.email || user?.email}</AppText>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={handleEditProfile}
        >
          <AppText style={styles.sectionTitle}>{t('profile.personalInfo')}</AppText>
          <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
        </TouchableOpacity>
        <View style={styles.sectionContent}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#757575" />
            <View style={styles.infoContent}>
              <AppText style={styles.infoLabel}>{t('profile.firstname')}</AppText>
              <AppText style={styles.infoValue}>
                {profile?.firstname || user?.firstname}
              </AppText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#757575" />
            <View style={styles.infoContent}>
              <AppText style={styles.infoLabel}>{t('profile.lastname')}</AppText>
              <AppText style={styles.infoValue}>
                {profile?.lastname || user?.lastname}
              </AppText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#757575" />
            <View style={styles.infoContent}>
              <AppText style={styles.infoLabel}>{t('profile.email')}</AppText>
              <AppText style={styles.infoValue}>
                {profile?.email || user?.email}
              </AppText>
            </View>
          </View>
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#757575" />
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>{t('profile.phone')}</AppText>
                <AppText style={styles.infoValue}>{profile.phone}</AppText>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>{t('profile.settings')}</AppText>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(app)/wallet')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="wallet-outline" size={20} color="#2196F3" />
              <AppText style={styles.menuText}>{t('wallet.title')}</AppText>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(app)/(tabs)/profile/loyalty')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="star-outline" size={20} color="#2196F3" />
              <AppText style={styles.menuText}>{t('profile.myLoyalty')}</AppText>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(app)/vehicles')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="car-outline" size={20} color="#2196F3" />
              <AppText style={styles.menuText}>{t('profile.myVehicles')}</AppText>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(app)/(tabs)/profile/referral')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="gift-outline" size={20} color="#2196F3" />
              <AppText style={styles.menuText}>{t('profile.referralProgram')}</AppText>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/settings/language')}
          >
            <Ionicons name="language-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.language')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/settings/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.notifications')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/reviews')}
          >
            <Ionicons name="star-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('review.myReviews')}</AppText>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/complaints')}
          >
            <Ionicons name="document-text-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('complaint.myComplaints')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.changePassword')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>{t('common.support')}</AppText>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/help')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.help')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/privacy')}
          >
            <Ionicons name="shield-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.privacy')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.terms')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigateTo('/(app)/about')}
          >
            <Ionicons name="information-circle-outline" size={20} color="#757575" />
            <AppText style={styles.menuText}>{t('profile.about')}</AppText>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>{t('common.danger')}</AppText>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <AppText style={[styles.menuText, styles.dangerText]}>{t('profile.logout')}</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <AppText style={[styles.menuText, styles.dangerText]}>{t('profile.deleteAccount')}</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <AppText style={styles.modalTitle}>{t('profile.edit')}</AppText>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.firstname')}</AppText>
                <TextInput
                  style={styles.input}
                  value={editForm.firstname}
                  onChangeText={(text) => setEditForm({ ...editForm, firstname: text })}
                  placeholder={t('auth.register.firstnamePlaceholder')}
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.lastname')}</AppText>
                <TextInput
                  style={styles.input}
                  value={editForm.lastname}
                  onChangeText={(text) => setEditForm({ ...editForm, lastname: text })}
                  placeholder={t('auth.register.lastnamePlaceholder')}
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.phone')}</AppText>
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder={t('profile.phone')}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                onPress={() => setShowEditProfile(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <AppButton
                title={t('profile.save')}
                onPress={handleSaveProfile}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <AppText style={styles.modalTitle}>{t('profile.changePassword')}</AppText>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.currentPassword')}</AppText>
                <TextInput
                  style={styles.input}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  placeholder={t('profile.currentPassword')}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.newPassword')}</AppText>
                <TextInput
                  style={styles.input}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  placeholder={t('profile.newPassword')}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{t('profile.confirmPassword')}</AppText>
                <TextInput
                  style={styles.input}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                  placeholder={t('profile.confirmPassword')}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                onPress={() => setShowChangePassword(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <AppButton
                title={t('profile.save')}
                onPress={handleSubmitPassword}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarTouchable: {
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#757575',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  sectionContent: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A2E',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 12,
  },
  dangerItem: {
    marginTop: 8,
  },
  dangerText: {
    color: '#F44336',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
