import { ref } from 'vue';

const state = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info'
});

let resolvePromise = null;

export function useConfirm() {
  
  const confirm = ({ 
    title = 'Are you sure?', 
    message = 'This action cannot be undone.', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    type = 'info'
  }) => {
    state.value = {
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type
    };

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