import { ref } from 'vue';

const state = ref({
  isOpen: false,
  title: '',
  message: '',
  buttonText: 'OK',
  type: 'info' 
});

let resolvePromise = null;

export function useAlert() {
  
  const alert = ({ 
    title = 'Alert', 
    message = '', 
    buttonText = 'OK', 
    type = 'info' 
  }) => {
    state.value = {
      isOpen: true,
      title,
      message,
      buttonText,
      type
    };

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const handleClose = () => {
    state.value.isOpen = false;
    if (resolvePromise) resolvePromise(true);
  };

  return {
    state,
    alert,
    handleClose
  };
}