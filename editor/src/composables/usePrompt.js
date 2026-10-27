import { ref } from 'vue';

const state = ref({
  isOpen: false,
  title: '',
  message: '',
  inputValue: '',
  placeholder: '',
  confirmText: 'OK',
  cancelText: 'Cancel'
});

let resolvePromise = null;

export function usePrompt() {
  
  const prompt = ({ 
    title = 'Input Required', 
    message = '', 
    defaultValue = '', 
    placeholder = '',
    confirmText = 'OK', 
    cancelText = 'Cancel'
  }) => {
    state.value = {
      isOpen: true,
      title,
      message,
      inputValue: defaultValue,
      placeholder,
      confirmText,
      cancelText
    };

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const handleConfirm = () => {
    state.value.isOpen = false;
    if (resolvePromise) resolvePromise(state.value.inputValue);
  };

  const handleCancel = () => {
    state.value.isOpen = false;
    if (resolvePromise) resolvePromise(null); 
  };

  return {
    state,
    prompt,
    handleConfirm,
    handleCancel
  };
}