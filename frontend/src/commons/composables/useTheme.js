import { ref, watch } from 'vue'

const saved = localStorage.getItem('theme')
const isDark = ref(
  saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

function applyTheme() {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}
applyTheme()

watch(isDark, () => {
  applyTheme()
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return {
    isDark,
    toggleTheme
  }
}