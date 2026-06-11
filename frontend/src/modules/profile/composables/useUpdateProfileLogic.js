import { ref, onMounted } from 'vue';
import { useAuthActions } from '@/stores/scene/useAuthActions.js';
import { useAuthStore } from '@/stores/useAuthStore.js';
import { usePopAlert } from '@/composables/usePopAlert.js';
import { useProfileBackend } from '@/services/api/backend/useProfileBackend.js'; 
import { useBackend } from '@/services/api/useBackend.js'; 

export function useUpdateProfileLogic() {
  const { getCurrentUser } = useAuthActions();
  const authStore = useAuthStore();
  const { showPop } = usePopAlert();
  const { uploadAvatarToServer, updateProfileToServer } = useProfileBackend();
  const { API_URL, fetchWithTimeout } = useBackend(); 

  const currentUser = ref(null);
  const isLoading = ref(true);
  const isSaving = ref(false);

  const profileData = ref({
    userId: '',
    username: '',
    display_name: '',
    bio: '',
    website_url: '',
    github_url: '',
    twitter_url: '',
    avatar_url: ''
  });

  const isCropperOpen = ref(false);
  const selectedImageFile = ref(null);
  const isUploadingAvatar = ref(false);

  onMounted(async () => {
    isLoading.value = true;
    const user = getCurrentUser();
    
    if (user) {
      currentUser.value = user;
      
      profileData.value.userId = user.id;
      profileData.value.username = user.username || '';
      profileData.value.display_name = user.display_name || user.name || '';
      profileData.value.avatar_url = user.avatar_url || '';

      try {
        const response = await fetchWithTimeout(`${API_URL}/profile/${user.username}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
          const dbProfile = result.data.profile;
          
          profileData.value = {
            userId: user.id,
            username: dbProfile.username || '',
            display_name: dbProfile.display_name || '',
            bio: dbProfile.bio || '',
            website_url: dbProfile.website_url || '',
            github_url: dbProfile.github_url || '',
            twitter_url: dbProfile.twitter_url || '',
            avatar_url: dbProfile.avatar_url || ''
          };
        }
      } catch (error) {
        console.warn('Gagal memuat data profil lengkap dari server:', error);
      }
    }
    
    isLoading.value = false;
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    selectedImageFile.value = file;
    isCropperOpen.value = true;
    event.target.value = ''; 
  };

  const handleCropAndUpload = async (croppedFile) => {
    isUploadingAvatar.value = true;
    try {
      const result = await uploadAvatarToServer(croppedFile, currentUser.value.id);
      profileData.value.avatar_url = result.data.avatar_url;
      
      authStore.updateUserField({ avatar_url: result.data.avatar_url });

      showPop({ title: 'Sukses', message: 'Foto profil diperbarui!', type: 'success' });
      isCropperOpen.value = false;
    } catch (error) {
      showPop({ title: 'Gagal', message: error.message, type: 'error' });
    } finally {
      isUploadingAvatar.value = false;
      selectedImageFile.value = null;
    }
  };

  const handleSaveProfile = async () => {
    isSaving.value = true;
    try {
      await updateProfileToServer(profileData.value);
      
      authStore.updateUserField({ 
        username: profileData.value.username,
        display_name: profileData.value.display_name
      });
      
      showPop({ title: 'Tersimpan', message: 'Profil berhasil diperbarui.', type: 'success' });
    } catch (error) {
      showPop({ title: 'Error', message: error.message, type: 'error' });
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isLoading,
    isSaving,
    profileData,
    isCropperOpen,
    selectedImageFile,
    isUploadingAvatar,
    handleFileSelect,
    handleCropAndUpload,
    handleSaveProfile
  };
}