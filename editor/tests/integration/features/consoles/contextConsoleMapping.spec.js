import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContextSystem, { getScriptContextMetadata, ScriptAssertionError } from '@core/Script/ContextSystem.js'
import ScriptRunner from '@core/Script/ScriptRunner.js'
import EngineConsole from '@core/Util/EngineConsole.js'
import { bus } from '@core/Util/EventBus.js'

describe('Context Console Mapping Integration', () => {
  let mockGame
  let mockRunner
  let mockNode

  beforeEach(() => {
    vi.clearAllMocks()

    mockGame = {
      deltaTime: 0.016,
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn()
      },
      sceneSystem: {
        getCurrentSceneScriptId: vi.fn(() => 'TestScene'),
        getCurrentSceneId: vi.fn(() => 'scene_01')
      },
      world: {
        entities: [],
        scripts: {}
      }
    }

    mockRunner = {
      owner: {
        id: 'ent_123',
        scriptId: 'player_hero'
      },
      scriptId: 'script_player',
      data: {
        id: 'script_player',
        scriptId: 'PlayerController'
      },
      getNodeState: vi.fn(() => ({}))
    }

    mockNode = {
      id: 'node_456',
      type: 'customAction',
      settings: {
        headerTitle: 'JumpAction'
      }
    }
  })

  describe('getScriptContextMetadata', () => {
    it('correctly maps scene, entityScriptId, scriptName, and nodeName', () => {
      const meta = getScriptContextMetadata(mockGame, mockRunner, mockNode)

      expect(meta.scene).toBe('TestScene')
      expect(meta.entityScriptId).toBe('player_hero')
      expect(meta.script).toBe('PlayerController')
      expect(meta.node).toBe('JumpAction')
      expect(meta.prefix).toBe('[TestScene] [player_hero] [PlayerController] [JumpAction]')
    })

    it('falls back to entity id when scriptId is not provided', () => {
      mockRunner.owner = { id: 'ent_999' }
      const meta = getScriptContextMetadata(mockGame, mockRunner, mockNode)

      expect(meta.entityScriptId).toBe('ent_999')
      expect(meta.prefix).toBe('[TestScene] [ent_999] [PlayerController] [JumpAction]')
    })

    it('falls back to Global when owner is null', () => {
      mockRunner.owner = null
      const meta = getScriptContextMetadata(mockGame, mockRunner, mockNode)

      expect(meta.entityScriptId).toBe('Global')
      expect(meta.prefix).toBe('[TestScene] [Global] [PlayerController] [JumpAction]')
    })
  })

  describe('ContextSystem Console & Notification Mapping', () => {
    let contextSystem
    let execContext

    beforeEach(() => {
      contextSystem = new ContextSystem(mockGame)
      execContext = contextSystem.createExecutionContext(mockRunner, mockNode)
    })

    it('maps context.console.log with [Scene] [Entity] [Script] [Node]', () => {
      execContext.console.log('Player jumped successfully')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:log', expect.objectContaining({
        type: 'log',
        message: '[TestScene] [player_hero] [PlayerController] [JumpAction] Player jumped successfully',
        source: 'Script',
        context: {
          scene: 'TestScene',
          entityScriptId: 'player_hero',
          script: 'PlayerController',
          node: 'JumpAction'
        }
      }))
    })

    it('maps context.console.warn with [Scene] [Entity] [Script] [Node]', () => {
      execContext.console.warn('Low stamina!')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:warn', expect.objectContaining({
        type: 'warn',
        message: '[TestScene] [player_hero] [PlayerController] [JumpAction] Low stamina!',
        source: 'Script',
        context: {
          scene: 'TestScene',
          entityScriptId: 'player_hero',
          script: 'PlayerController',
          node: 'JumpAction'
        }
      }))
    })

    it('maps context.console.error with [Scene] [Entity] [Script] [Node]', () => {
      execContext.console.error('Cannot jump while stunned')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:error', expect.objectContaining({
        type: 'error',
        message: '[TestScene] [player_hero] [PlayerController] [JumpAction] Cannot jump while stunned',
        source: 'Script',
        context: {
          scene: 'TestScene',
          entityScriptId: 'player_hero',
          script: 'PlayerController',
          node: 'JumpAction'
        }
      }))
    })

    it('maps context.ui.notify and context.notify user notifications', () => {
      execContext.ui.notify('Checkpoint reached', 'Notification', 'log')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:log', expect.objectContaining({
        type: 'log',
        message: '[TestScene] [player_hero] [PlayerController] [JumpAction] Checkpoint reached',
        source: 'Notification',
        context: {
          scene: 'TestScene',
          entityScriptId: 'player_hero',
          script: 'PlayerController',
          node: 'JumpAction'
        }
      }))

      // Test context.notify shortcut with warn type
      execContext.notify('Warning: boss ahead', 'UserAlert', 'warn')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:warn', expect.objectContaining({
        type: 'warn',
        message: '[TestScene] [player_hero] [PlayerController] [JumpAction] Warning: boss ahead',
        source: 'UserAlert'
      }))
    })

    it('formats map and list notifications with pretty indentation', () => {
      const sampleList = ['item1', 'item2']
      execContext.ui.notify(sampleList, 'Inventory')

      const expectedPrettyList = JSON.stringify(sampleList, null, 2)
      expect(mockGame.events.emit).toHaveBeenCalledWith('console:log', expect.objectContaining({
        type: 'log',
        message: `[TestScene] [player_hero] [PlayerController] [JumpAction] ${expectedPrettyList}`,
        source: 'Inventory'
      }))

      const sampleMap = { score: 100, lives: 3 }
      execContext.notify(sampleMap, 'Stats')

      const expectedPrettyMap = JSON.stringify(sampleMap, null, 2)
      expect(mockGame.events.emit).toHaveBeenCalledWith('console:log', expect.objectContaining({
        type: 'log',
        message: `[TestScene] [player_hero] [PlayerController] [JumpAction] ${expectedPrettyMap}`,
        source: 'Stats'
      }))

      const es6Map = new Map([['health', 50]])
      execContext.notify(es6Map, 'ES6Map')
      const expectedPrettyES6Map = JSON.stringify({ health: 50 }, null, 2)
      expect(mockGame.events.emit).toHaveBeenCalledWith('console:log', expect.objectContaining({
        type: 'log',
        message: `[TestScene] [player_hero] [PlayerController] [JumpAction] ${expectedPrettyES6Map}`,
        source: 'ES6Map'
      }))
    })

    it('maps context.assert errors with [Scene] [Entity] [Script] [Node] [Assert Error] and shows node name', () => {
      expect(() => {
        execContext.assert.isTrue(false, 'Expected health > 0')
      }).toThrow(ScriptAssertionError)

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:error', expect.objectContaining({
        type: 'error',
        message: expect.stringContaining("[TestScene] [player_hero] [PlayerController] [JumpAction] [Assert Error] Expected health > 0 (node: 'JumpAction')"),
        source: 'Assert'
      }))
    })
  })

  describe('ScriptRunner Error Mapping', () => {
    it('maps runtime errors thrown during node execution', () => {
      const scriptData = {
        id: 'script_combat',
        scriptId: 'CombatScript',
        nodes: [
          {
            id: 'node_err',
            type: 'badNode',
            settings: { headerTitle: 'CrashNode' },
            code: 'throw new Error("Simulated node crash");'
          }
        ]
      }

      mockGame.contextSystem = new ContextSystem(mockGame)
      const runner = new ScriptRunner(mockGame, scriptData, mockRunner.owner)

      expect(() => {
        runner._executeNodeLogic(scriptData.nodes[0], null)
      }).toThrow('Simulated node crash')

      expect(mockGame.events.emit).toHaveBeenCalledWith('console:error', expect.objectContaining({
        type: 'error',
        message: '[TestScene] [player_hero] [CombatScript] [CrashNode] Simulated node crash',
        source: 'ScriptRunner',
        context: {
          scene: 'TestScene',
          entityScriptId: 'player_hero',
          script: 'CombatScript',
          node: 'CrashNode'
        }
      }))
    })
  })

  describe('EngineConsole Direct Mapping', () => {
    it('formats message when context is passed to EngineConsole', () => {
      const econsole = new EngineConsole()
      const busEmitSpy = vi.spyOn(bus, 'emit')

      econsole.error('Custom engine warning', {
        scene: 'SceneLevel1',
        entityScriptId: 'npc_merchant',
        script: 'DialogueSystem',
        node: 'ShowDialogue'
      })

      expect(econsole.logs).toHaveLength(1)
      expect(econsole.logs[0].message).toBe('[SceneLevel1] [npc_merchant] [DialogueSystem] [ShowDialogue] Custom engine warning')
      expect(busEmitSpy).toHaveBeenCalledWith('console:error', expect.objectContaining({
        type: 'error',
        message: '[SceneLevel1] [npc_merchant] [DialogueSystem] [ShowDialogue] Custom engine warning'
      }))
    })
  })
})
