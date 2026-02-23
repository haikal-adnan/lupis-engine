import { ref, onMounted, watch } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function applyTheme() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function initTheme() {
    const saved = localStorage.getItem('theme')
    isDark.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    applyTheme()
  }

  watch(isDark, () => applyTheme())

  return {
    isDark,
    toggleTheme,
    initTheme
  }
}