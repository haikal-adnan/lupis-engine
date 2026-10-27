import { ref } from 'vue'

const isReduceMotion = ref(
  typeof window !== 'undefined'
    ? localStorage.getItem('perf_reduce_motion') === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
)

function applyMotion() {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (isReduceMotion.value) {
    html.classList.add('reduce-motion')
  } else {
    html.classList.remove('reduce-motion')
  }
}

if (typeof window !== 'undefined') {
  applyMotion()
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (localStorage.getItem('perf_reduce_motion') === null) {
      isReduceMotion.value = e.matches
      applyMotion()
    }
  })
}

export function usePerformance() {
  function toggleReduceMotion() {
    isReduceMotion.value = !isReduceMotion.value
    localStorage.setItem('perf_reduce_motion', String(isReduceMotion.value))
    applyMotion()
  }

  function setReduceMotion(val) {
    isReduceMotion.value = !!val
    localStorage.setItem('perf_reduce_motion', String(isReduceMotion.value))
    applyMotion()
  }

  return {
    isReduceMotion,
    toggleReduceMotion,
    setReduceMotion
  }
}
