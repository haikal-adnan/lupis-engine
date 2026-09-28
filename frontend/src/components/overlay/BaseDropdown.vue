<template>
  <div ref="triggerRef" class="relative inline-block text-left h-full">
    <div @click.stop="toggle" class="h-full cursor-pointer outline-none">
      <slot name="trigger" :isOpen="isOpen"></slot>
    </div>

    <Teleport to="body">
      <transition name="fade-scale">
        <div
          v-if="isOpen"
          ref="menuRef"
          class="fixed z-[9999] w-auto whitespace-nowrap rounded-md border border-border bg-popover text-popover-foreground shadow-lg focus:outline-none flex flex-col overflow-hidden py-1"
          :style="menuStyle"
          tabindex="-1"
          @click.stop 
        >
          <slot :close="close" />
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';

const props = defineProps({
  align: { type: String, default: 'left' },
  offset: { type: Number, default: 6 } 
});

const isOpen = ref(false);
const triggerRef = ref(null);
const menuRef = ref(null);
const menuStyle = ref({ top: '0px', left: '0px' });

const calculatePosition = async () => {
  await nextTick();
  if (!triggerRef.value || !menuRef.value) return;

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const menuRect = menuRef.value.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;

  let top = triggerRect.bottom + props.offset;
  
  let left = props.align === 'right' 
    ? triggerRect.right - menuRect.width 
    : triggerRect.left;

  if (left + menuRect.width > innerWidth) {
    left = innerWidth - menuRect.width - 10; 
  }
  if (left < 0) {
    left = 10; 
  }

  if (top + menuRect.height > innerHeight) {
    top = triggerRect.top - menuRect.height - props.offset;
  }

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  };
};

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

defineExpose({ close, open: toggle });

const handleClickOutside = (event) => {
  if (!isOpen.value) return;
  
  const clickedInTrigger = triggerRef.value?.contains(event.target);
  const clickedInMenu = menuRef.value?.contains(event.target);
  
  if (!clickedInTrigger && !clickedInMenu) {
    close();
  }
};

const handleScrollOrResize = () => {
  if (isOpen.value) close();
};

watch(isOpen, (val) => {
  if (val) {
    calculatePosition();
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
    }, 10);
  } else {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('resize', handleScrollOrResize);
    window.removeEventListener('scroll', handleScrollOrResize, true);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleScrollOrResize);
  window.removeEventListener('scroll', handleScrollOrResize, true);
});
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>