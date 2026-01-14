import { ref, onMounted, onUnmounted } from 'vue'
import { bus } from '@engines/Util/EventBus.js' // Sesuaikan path EventBus
import { econsole } from '@engines/Util/EngineConsole.js' // Sesuaikan path EngineConsole

// State global (di luar fungsi) agar log tetap tersimpan meski panel ditutup-buka
const logs = ref([])

export function useConsole() {

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', { 
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    })
  }

  const processLogEntry = (entry) => {
    return {
      ...entry,
      // Mapping 'log' dari engine menjadi 'info' untuk UI
      type: entry.type === 'log' ? 'info' : entry.type,
      formattedTime: formatTime(entry.time)
    }
  }

  // Handler saat ada event baru masuk dari Bus
  const handleLogEvent = (entry) => {
    logs.value.push(processLogEntry(entry))
    
    // Opsional: Batasi jumlah log di UI agar tidak berat (misal max 1000)
    if (logs.value.length > 1000) logs.value.shift()
  }

  const handleClearEvent = () => {
    logs.value = []
  }

  // Fungsi untuk memicu clear dari UI
  const triggerClear = () => {
    econsole.clear() // Ini akan mentrigger event 'console:clear' via Bus
  }

  onMounted(() => {
    // 1. Sinkronisasi Awal: Ambil log yang sudah tersimpan di memori Engine
    // Ini penting jika Engine berjalan duluan sebelum UI Console dibuka
    if (logs.value.length === 0 && econsole.logs.length > 0) {
      logs.value = econsole.logs.map(processLogEntry)
    }

    // 2. Setup Listeners
    bus.on('console:log', handleLogEvent)
    bus.on('console:warn', handleLogEvent)
    bus.on('console:error', handleLogEvent)
    bus.on('console:clear', handleClearEvent)
  })

  onUnmounted(() => {
    // Cleanup listeners saat component di-destroy
    bus.off('console:log', handleLogEvent)
    bus.off('console:warn', handleLogEvent)
    bus.off('console:error', handleLogEvent)
    bus.off('console:clear', handleClearEvent)
  })

  return {
    logs,
    triggerClear
  }
}