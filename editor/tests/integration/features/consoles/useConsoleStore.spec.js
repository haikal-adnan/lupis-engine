import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsoleStore } from '@consoles/consoles.js'
import { bus } from '@core/Util/EventBus.js'
import { econsole } from '@core/Util/EngineConsole.js'

// 1. MOCK ENGINE MODULE BOUNDARIES
vi.mock('@core/Util/EventBus.js', () => {
  const handlers = {}
  return {
    bus: {
      on: vi.fn((event, handler) => {
        handlers[event] = handler
      }),
      off: vi.fn((event) => {
        delete handlers[event]
      }),
      emit: vi.fn((event, payload) => {
        if (handlers[event]) handlers[event](payload)
      }),
      __handlers: handlers
    }
  }
})

vi.mock('@core/Util/EngineConsole.js', () => ({
  econsole: {
    logs: [],
    clear: vi.fn()
  }
}))

// Mock Class BroadcastChannel agar aman saat dipanggil dengan `new`
class MockBroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
    this.postMessage = vi.fn()
    this.close = vi.fn()
  }
}

globalThis.BroadcastChannel = MockBroadcastChannel

describe('Integration Test: useConsoleStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Reset state mock econsole
    econsole.logs = []

    store = useConsoleStore()
  })

  /* =========================================================================
   * 1. CORE STORE & LOG PROCESSING
   * ========================================================================= */
  describe('Core Store Operations', () => {
    it('initializes with correct default state', () => {
      expect(store.logs).toEqual([])
      expect(store.isListening).toBe(false)
      expect(store.channel).toBeNull()
    })

    it('processes log entry and converts log type to info', () => {
      store.addLog({ type: 'log', message: 'Engine loaded', source: 'Core' })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0]).toMatchObject({
        type: 'info',
        message: 'Engine loaded',
        source: 'Core'
      })
      expect(store.logs[0].formattedTime).toBeDefined()
    })

    it('deduplicates consecutive identical logs at the last index and increments count', () => {
      store.addLog({ type: 'log', message: 'Tick event', source: 'Loop' })
      store.addLog({ type: 'log', message: 'Tick event', source: 'Loop' })
      store.addLog({ type: 'log', message: 'Tick event', source: 'Loop' })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0].message).toBe('Tick event')
      expect(store.logs[0].count).toBe(3)
    })

    it('creates a new log line when an identical log arrives but not at the last index', () => {
      store.addLog({ type: 'log', message: 'Tick event' })
      store.addLog({ type: 'warn', message: 'Warning alert' })
      store.addLog({ type: 'log', message: 'Tick event' })

      expect(store.logs).toHaveLength(3)
      expect(store.logs[0].count).toBe(1)
      expect(store.logs[1].count).toBe(1)
      expect(store.logs[2].count).toBe(1)
    })

    it('limits logs array length to maximum 1000 items', () => {
      for (let i = 1; i <= 1005; i++) {
        store.addLog({ type: 'info', message: `Log ${i}` })
      }

      expect(store.logs).toHaveLength(1000)
      expect(store.logs[0].message).toBe('Log 6')
      expect(store.logs[999].message).toBe('Log 1005')
    })

    it('clears store logs, calls econsole.clear, and posts broadcast message', () => {
      store.initListeners()
      store.addLog({ type: 'info', message: 'Test Log' })

      store.clearLogs()

      expect(store.logs).toEqual([])
      expect(econsole.clear).toHaveBeenCalledTimes(1)
      expect(store.channel.postMessage).toHaveBeenCalledWith({
        type: 'CONSOLE_CLEAR_REQUEST'
      })
    })
  })

  /* =========================================================================
   * 2. ENGINE EVENT BUS SYNC
   * ========================================================================= */
  describe('Engine EventBus Integration', () => {
    it('hydrates initial logs from econsole upon initListeners', () => {
      econsole.logs = [
        { type: 'warn', message: 'Initial Warning', source: 'Engine' }
      ]

      store.initListeners()

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0].message).toBe('Initial Warning')
    })

    it('receives console events emitted from EventBus', () => {
      store.initListeners()

      bus.emit('console:log', { type: 'log', message: 'Bus message', source: 'Physics' })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0]).toMatchObject({
        type: 'info',
        message: 'Bus message',
        source: 'Physics'
      })
    })

    it('clears logs when console:clear event is emitted via EventBus', () => {
      store.initListeners()
      store.addLog({ type: 'error', message: 'Fatal crash' })

      bus.emit('console:clear')

      expect(store.logs).toEqual([])
    })
  })

  /* =========================================================================
   * 3. BROADCAST CHANNEL SYNC
   * ========================================================================= */
  describe('BroadcastChannel Integration', () => {
    it('handles ENGINE_CONSOLE_LOG message from BroadcastChannel onmessage callback', () => {
      store.initListeners()

      store.channel.onmessage({
        data: {
          type: 'ENGINE_CONSOLE_LOG',
          payload: { type: 'warn', message: 'Preview Warning', source: 'Preview' }
        }
      })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0]).toMatchObject({
        type: 'warn',
        message: 'Preview Warning',
        source: 'Preview'
      })
    })

    it('handles ENGINE_CONSOLE_CLEAR message from BroadcastChannel onmessage callback', () => {
      store.initListeners()
      store.addLog({ type: 'info', message: 'Sample' })

      store.channel.onmessage({
        data: { type: 'ENGINE_CONSOLE_CLEAR' }
      })

      expect(store.logs).toEqual([])
    })

    it('handles PREVIEW_CLOSED message from BroadcastChannel onmessage callback', () => {
      store.initListeners()

      store.channel.onmessage({
        data: { type: 'PREVIEW_CLOSED' }
      })

      expect(store.logs).toHaveLength(1)
      expect(store.logs[0]).toMatchObject({
        type: 'warn',
        source: 'Engine Lifecycle',
        message: 'Preview window closed. Engine stopped.'
      })
    })
  })

  /* =========================================================================
   * 4. MAPPED CONTEXT LOGGING (Scene, Entity, Script, Node)
   * ========================================================================= */
  describe('Mapped Context Logging', () => {
    it('processes error log mapped with scene, entity, script, and node context', () => {
      store.addLog({
        type: 'error',
        message: '[Dungeon] [player_1] [PlayerController] [TakeDamage] Player health reached 0',
        source: 'Script',
        context: {
          scene: 'Dungeon',
          entityScriptId: 'player_1',
          script: 'PlayerController',
          node: 'TakeDamage'
        }
      })

      expect(store.logs).toHaveLength(1)
      const log = store.logs[0]
      expect(log.type).toBe('error')
      expect(log.message).toBe('[Dungeon] [player_1] [PlayerController] [TakeDamage] Player health reached 0')
      expect(log.context).toEqual({
        scene: 'Dungeon',
        entityScriptId: 'player_1',
        script: 'PlayerController',
        node: 'TakeDamage'
      })
    })

    it('processes warn log mapped with scene, entity, script, and node context', () => {
      store.addLog({
        type: 'warn',
        message: '[MainScene] [boss_orc] [OrcAI] [PatrolNode] Target waypoint out of bounds',
        source: 'Script',
        context: {
          scene: 'MainScene',
          entityScriptId: 'boss_orc',
          script: 'OrcAI',
          node: 'PatrolNode'
        }
      })

      expect(store.logs).toHaveLength(1)
      const log = store.logs[0]
      expect(log.type).toBe('warn')
      expect(log.message).toContain('[MainScene] [boss_orc] [OrcAI] [PatrolNode]')
      expect(log.context.node).toBe('PatrolNode')
    })

    it('processes user notification log mapped with context', () => {
      store.addLog({
        type: 'log',
        message: '[Level_01] [ui_manager] [ScoreScript] [Notification] Achievement unlocked!',
        source: 'Notification',
        context: {
          scene: 'Level_01',
          entityScriptId: 'ui_manager',
          script: 'ScoreScript',
          node: 'Notification'
        }
      })

      expect(store.logs).toHaveLength(1)
      const log = store.logs[0]
      expect(log.type).toBe('info') // converts log to info
      expect(log.source).toBe('Notification')
      expect(log.message).toBe('[Level_01] [ui_manager] [ScoreScript] [Notification] Achievement unlocked!')
      expect(log.context.script).toBe('ScoreScript')
    })
  })

  /* =========================================================================
   * 5. GUARD CLAUSES & BAD PATH
   * ========================================================================= */
  describe('Edge Cases & Guard Clauses', () => {
    it('[Bad Path] prevents re-attaching listeners if isListening is already true', () => {
      store.initListeners()
      store.initListeners()

      expect(store.isListening).toBe(true)
      expect(bus.on).toHaveBeenCalledTimes(4)
    })
  })

  /* =========================================================================
   * 6. PROJECT-SPECIFIC PREVIEW CHANNEL ISOLATION
   * ========================================================================= */
  describe('Project-Specific Channel Isolation', () => {
    it('initializes with project-specific channel when projectId is passed to initListeners', () => {
      store.initListeners('project_alpha_123')

      expect(store.channel.name).toBe('lupis_engine_preview_channel_project_alpha_123')
    })

    it('dynamically switches channel and closes previous channel when setProjectChannel is called', () => {
      store.initListeners('project_alpha')
      const initialChannel = store.channel
      expect(initialChannel.name).toBe('lupis_engine_preview_channel_project_alpha')

      store.setProjectChannel('project_beta')
      expect(initialChannel.close).toHaveBeenCalledTimes(1)
      expect(store.channel.name).toBe('lupis_engine_preview_channel_project_beta')
    })

    it('updates channel when initListeners is called with new projectId even if already listening', () => {
      store.initListeners('project_1')
      expect(store.channel.name).toBe('lupis_engine_preview_channel_project_1')

      store.initListeners('project_2')
      expect(store.channel.name).toBe('lupis_engine_preview_channel_project_2')
    })
  })
})