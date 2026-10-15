import { defineStore } from 'pinia'
import { bus } from '@core/Util/EventBus.js'
import { econsole } from '@core/Util/EngineConsole.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel"

export const useConsoleStore = defineStore('engine-console', {
  state: () => ({
    logs: [],
    channel: null,
    isListening: false
  }),

  actions: {
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('en-GB', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
      })
    },

    processLogEntry(entry) {
        return {
            ...entry, 
            type: entry.type === 'log' ? 'info' : entry.type,
            source: entry.source || 'System', 
            formattedTime: this.formatTime(entry.time || Date.now())
        }
    },

    addLog(entry) {
      this.logs.push(this.processLogEntry(entry))
      if (this.logs.length > 1000) this.logs.shift()
    },

    clearLogs() {
      this.logs = []
      econsole.clear()
      if (this.channel) {
        this.channel.postMessage({ type: "CONSOLE_CLEAR_REQUEST" })
      }
    },

    setProjectChannel(projectId) {
      const channelName = projectId ? `lupis_engine_preview_channel_${projectId}` : BROADCAST_CHANNEL_NAME
      if (this.channel && this.channel.name === channelName) return

      if (this.channel) {
        this.channel.close()
        this.channel = null
      }

      this.channel = new BroadcastChannel(channelName)
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data || {}
        if (type === "ENGINE_CONSOLE_LOG") {
          this.addLog(payload)
        } else if (type === "ENGINE_CONSOLE_CLEAR") {
          this.logs = []
        }
      }
    },

    initListeners(projectId) {
      if (this.isListening) {
        if (projectId) {
          this.setProjectChannel(projectId)
        }
        return
      }

      if (this.logs.length === 0 && econsole.logs.length > 0) {
        this.logs = econsole.logs.map(log => this.processLogEntry(log))
      }

      const handleLocalLog = (entry) => this.addLog(entry)
      bus.on('console:log', handleLocalLog)
      bus.on('console:warn', handleLocalLog)
      bus.on('console:error', handleLocalLog)
      bus.on('console:clear', () => this.clearLogs())

      let targetProjectId = projectId
      if (!targetProjectId) {
        try {
          const workspaceStore = useWorkspaceStore()
          targetProjectId = workspaceStore.activeProjectId
        } catch {
          // Fallback if called outside Pinia or in mock environment
        }
      }

      this.setProjectChannel(targetProjectId)
      this.isListening = true
    }
  }
})