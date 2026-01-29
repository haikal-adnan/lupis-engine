import { ref } from 'vue';

// State global agar bisa dipanggil dari mana saja (termasuk deep component node)
const popState = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning', // 'info' | 'success' | 'warning' | 'error'
});

let timer = null;

export function usePopAlert() {
  
  /**
   * Memicu alert muncul
   * @param {Object} options
   * @param {string} options.title - Judul alert
   * @param {string} options.message - Pesan detail
   * @param {string} options.type - Tipe styling
   * @param {number} options.duration - Durasi dalam milidetik (default 3000ms)
   */
  const showPop = ({ 
    title = 'Notification', 
    message = '', 
    type = 'warning', 
    duration = 3000 
  }) => {
    // 1. Reset timer jika ada alert sebelumnya yang masih aktif
    if (timer) clearTimeout(timer);

    // 2. Set content
    popState.value = {
      isOpen: true,
      title,
      message,
      type
    };

    // 3. Start timer baru untuk auto-close
    timer = setTimeout(() => {
      closePop();
    }, duration);
  };

  const closePop = () => {
    popState.value.isOpen = false;
    if (timer) clearTimeout(timer);
  };

  return {
    popState,
    showPop,
    closePop
  };
}