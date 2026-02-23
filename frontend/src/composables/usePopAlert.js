import { ref } from 'vue';

const popState = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning', // 'info' | 'success' | 'warning' | 'error'
});

let timer = null;

export function usePopAlert() {

  const showPop = ({ 
    title = 'Notification', 
    message = '', 
    type = 'warning', 
    duration = 3000 
  }) => {
    if (timer) clearTimeout(timer);

    popState.value = {
      isOpen: true,
      title,
      message,
      type
    };

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