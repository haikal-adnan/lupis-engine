import { ref } from 'vue';

const state = ref({
  isOpen: false,
  imageUrl: '',
  title: ''
});

export function usePopImage() {
  const showImage = (imageUrl, title = 'Image Preview') => {
    state.value = {
      isOpen: true,
      imageUrl,
      title
    };
  };

  const closeImage = () => {
    state.value.isOpen = false;
    // Beri jeda agar animasi selesai sebelum menghapus src gambar
    setTimeout(() => {
      state.value.imageUrl = '';
    }, 200);
  };

  return {
    state,
    showImage,
    closeImage
  };
}