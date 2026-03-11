import { ref } from 'vue';

const state = ref({
  isOpen: false,
  audioUrl: '',
  title: ''
});

export function usePopAudio() {
  const showAudio = (audioUrl, title = 'Audio Preview') => {
    state.value = {
      isOpen: true,
      audioUrl,
      title
    };
  };

  const closeAudio = () => {
    state.value.isOpen = false;
    setTimeout(() => {
      state.value.audioUrl = '';
    }, 200);
  };

  return {
    state,
    showAudio,
    closeAudio
  };
}