import { ref, watchEffect } from 'vue'

// Inisialisasi state sesuai dengan class 'dark' yang sudah terpasang dari index.html
const isDark = ref(document.documentElement.classList.contains('dark'))

function applyTheme() {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

// Dengarkan perubahan preferensi sistem secara realtime (jika tidak ada pilihan manual di localStorage)
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      applyTheme()
    }
  })
}

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function resetToSystem() {
    localStorage.removeItem('theme')
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme()
  }

  return {
    isDark,
    toggleTheme,
    resetToSystem
  }
}