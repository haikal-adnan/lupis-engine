import { ref, onMounted, onUnmounted } from 'vue'
import { bus } from '@engines/Util/EventBus.js'
import { econsole } from '@engines/Util/EngineConsole.js'

const logs = ref([])
const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export function useConsole() {
  let channel = null;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', { 
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    })
  }

  const processLogEntry = (entry) => {
    return {
      ...entry,
      type: entry.type === 'log' ? 'info' : entry.type,
      formattedTime: formatTime(entry.time)
    }
  }

  const handleLogEvent = (entry) => {
    logs.value.push(processLogEntry(entry))
    if (logs.value.length > 1000) logs.value.shift()
  }

  const handleClearEvent = () => {
    logs.value = []
  }

  const triggerClear = () => {
    econsole.clear()
    if (channel) {
       channel.postMessage({ type: "CONSOLE_CLEAR_REQUEST" });
    }
  }

  onMounted(() => {
    if (logs.value.length === 0 && econsole.logs.length > 0) {
      logs.value = econsole.logs.map(processLogEntry)
    }

    bus.on('console:log', handleLogEvent)
    bus.on('console:warn', handleLogEvent)
    bus.on('console:error', handleLogEvent)
    bus.on('console:clear', handleClearEvent)

    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "ENGINE_CONSOLE_LOG") {
        handleLogEvent(payload);
      } else if (type === "ENGINE_CONSOLE_CLEAR") {
        handleClearEvent();
      }
    };
  })

  onUnmounted(() => {
    bus.off('console:log', handleLogEvent)
    bus.off('console:warn', handleLogEvent)
    bus.off('console:error', handleLogEvent)
    bus.off('console:clear', handleClearEvent)
    
    if (channel) {
      channel.close();
      channel = null;
    }
  })

  return {
    logs,
    triggerClear
  }
}