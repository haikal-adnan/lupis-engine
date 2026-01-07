import { ref } from 'vue';

// State Global (Singleton)
const state = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info' // 'info' | 'danger' | 'warning'
});

// Resolver Promise
let resolvePromise = null;

export function useConfirm() {
  
  const confirm = ({ 
    title = 'Are you sure?', 
    message = 'This action cannot be undone.', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    type = 'info'
  }) => {
    // Set content
    state.value = {
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type
    };

    // Return new Promise yang akan di-resolve nanti oleh tombol di UI
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const handleConfirm = () => {
    state.value.isOpen = false;
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    state.value.isOpen = false;
    if (resolvePromise) resolvePromise(false);
  };

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel
  };
}