import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 
import { usePopAlert } from '@/composables/usePopAlert.js';
import { createPublished } from '@services/schema/publishedSchema.js';
import { usePublishBackend } from '@/services/api/backend/usePublishBackend.js';
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';
import { useThumbnailUrl } from '@/composables/useThumbnailUrl.js';

export function usePublishLogic() {
  const route = useRoute();
  const router = useRouter();
  
  const { getCurrentUser } = useAuthActions();
  const { showPop } = usePopAlert();
  
  const { createPublishedGame, checkSlugAvailability, getPublishedByProjectId, updatePublishedGame, uploadThumbnailToServer } = usePublishBackend();
  const { getProjectById } = useProjectBackend(); 
  const { getThumbnailUrl } = useThumbnailUrl();

  const projectId = route.params.idProject;
  const currentUser = ref(getCurrentUser());

  const isCropperOpen = ref(false);
  const selectedImageFile = ref(null);
  const isUploadingThumbnail = ref(false);
  
  const pendingThumbnailFile = ref(null); 
  
  const isLoading = ref(false);
  const isUpdating = ref(false);
  const publishData = ref(createPublished());
  const thumbnailPreview = ref(null);
  const slugStatus = ref('idle');

  const fetchPublishData = async () => {
    isLoading.value = true;
    try {
      const projectData = await getProjectById(projectId);
      const existingData = await getPublishedByProjectId(projectId);
      
      if (existingData) {
        isUpdating.value = true;
        publishData.value = createPublished(existingData);
        
        if (existingData.thumbnailUrl) {
          thumbnailPreview.value = getThumbnailUrl(existingData.thumbnailUrl);
        }
        
        slugStatus.value = 'available'; 
      } else {
        isUpdating.value = false;
        const initialData = createPublished({
          projectId: projectId,
          ownerId: currentUser.value?.id,
          title: projectData?.name || "New Game" 
        });
        
        initialData.playOnBrowser = false;
        publishData.value = initialData;
      }
    } catch (error) {
      console.error(error);
      showPop({ title: 'Error', message: 'Gagal memuat data game.', type: 'error' });
    } finally {
      isLoading.value = false;
    }
  };

  const checkSlug = async () => {
    if (!publishData.value.slug || publishData.value.slug.trim() === '') {
      slugStatus.value = 'idle';
      return;
    }
    
    slugStatus.value = 'checking';
    try {
      const res = await checkSlugAvailability(publishData.value.slug);
      slugStatus.value = res.available ? 'available' : 'taken';
    } catch (error) {
      slugStatus.value = 'idle';
      showPop({ title: 'Error', message: 'Gagal memvalidasi slug.', type: 'error' });
    }
  };

  const triggerUpload = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (type === 'thumbnail') {
      input.accept = 'image/png, image/jpeg, image/gif, image/webp';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        selectedImageFile.value = file;
        isCropperOpen.value = true;
      };
    } else {
      input.accept = '.exe,.apk,.bin,.zip,.rar';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showPop({ title: 'Uploading', message: `Mengunggah ${file.name}...`, type: 'info' });
        setTimeout(() => {
          if (type === 'exe') publishData.value.downloads.exe = `https://lupis-engine.cloud/downloads/${file.name}`;
          else if (type === 'apk') publishData.value.downloads.apk = `https://lupis-engine.cloud/downloads/${file.name}`;
          else if (type === 'bin') publishData.value.downloads.bin = `https://lupis-engine.cloud/downloads/${file.name}`;
          showPop({ title: 'Sukses', message: 'File berhasil diunggah (Mock)!', type: 'success' });
        }, 1500); 
      };
    }

    input.click();
  };

  const handleCropAndUploadThumbnail = (croppedFile) => {
    pendingThumbnailFile.value = croppedFile; 
    
    if (thumbnailPreview.value && thumbnailPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview.value); 
    }
    thumbnailPreview.value = URL.createObjectURL(croppedFile);
    
    isCropperOpen.value = false;
    selectedImageFile.value = null; 
  };

  const handleSave = async () => {
    if (slugStatus.value === 'taken') {
      showPop({ title: 'Peringatan', message: 'Slug sudah digunakan, pilih yang lain.', type: 'warning' });
      return;
    }

    isLoading.value = true;
    publishData.value.updatedAt = new Date().toISOString();
    
    try {
      if (pendingThumbnailFile.value) {
        const result = await uploadThumbnailToServer(pendingThumbnailFile.value);
        publishData.value.thumbnailUrl = result.thumbnailUrl;
      }

      if (!isUpdating.value) {
        await createPublishedGame(publishData.value);
      } else {
        await updatePublishedGame(publishData.value._id, publishData.value);
      }
      
      showPop({
        title: 'Success',
        message: isUpdating.value ? 'Data publish berhasil diperbarui!' : 'Game berhasil di-publish!',
        type: 'success'
      });
      
      router.push(`/game/${publishData.value.slug}`); 
      
    } catch (error) {
      showPop({ title: 'Error', message: error.message || 'Gagal menyimpan data.', type: 'error' });
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(async () => {
    if (!currentUser.value) {
      router.push({ name: 'Landing', query: { action: 'login' } });
      return;
    }
    await fetchPublishData();
  });

  return {
    slugStatus,  
    checkSlug,
    isLoading,
    isUpdating,
    publishData,
    thumbnailPreview,
    triggerUpload,
    handleSave,
    router,
    isCropperOpen,
    selectedImageFile,
    isUploadingThumbnail, 
    handleCropAndUploadThumbnail
  };
}