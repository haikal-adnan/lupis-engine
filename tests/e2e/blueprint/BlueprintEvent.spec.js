import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Event E2E',
    description: 'E2E runtime logic evaluation for Events & Signals nodes (action_emit_signal, event_on_signal) in engine preview',
  },
});

test.describe('Blueprint Events & Signals (category_events) E2E Testing', () => {

  // =========================================================================
  // 1. EMIT SIGNAL NODE TESTS
  // =========================================================================
  test.describe('Emit Signal Node', () => {

    test('Emits signal and continues execution out safely', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Emit Signal - Standalone Execution Out',
        entityName: 'SignalEmitterEntity',
        scriptName: 'Script_EmitSignal_Simple',
        variables: [
          { name: 'signalName', type: 'string', value: 'GameSaveTriggered' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varSig', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'emitNode', type: 'action_emit_signal', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Signal Emitted Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varSig', varName: 'signalName' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'emitNode', targetHandle: 'exec_in' },
          { source: 'varSig', sourceHandle: 'out_0', target: 'emitNode', targetHandle: 'sig_name' },
          { source: 'emitNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Signal Emitted Successfully',
      });
    });

    test('Handles empty signal name gracefully without interrupting execution flow', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Emit Signal - Empty Signal Name Guard',
        entityName: 'SignalEmitterEntity',
        scriptName: 'Script_EmitSignal_EmptyGuard',
        variables: [
          { name: 'emptySig', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varSig', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'emitNode', type: 'action_emit_signal', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Empty Signal Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varSig', varName: 'emptySig' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'emitNode', targetHandle: 'exec_in' },
          { source: 'varSig', sourceHandle: 'out_0', target: 'emitNode', targetHandle: 'sig_name' },
          { source: 'emitNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Empty Signal Safe Out',
      });
    });
  });

  // =========================================================================
  // 2. ON SIGNAL RECEIVED NODE & END-TO-END EVENT CYCLE TESTS
  // =========================================================================
  test.describe('On Signal Received Node', () => {

    test('Receives matching emitted signal and triggers execution flow', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'On Signal - Match and Trigger Flow',
        entityName: 'SignalBridgeEntity',
        scriptName: 'Script_Signal_FullCycle',
        variables: [
          { name: 'sigChannel', type: 'string', value: 'PlayerDied' },
        ],
        nodes: [
          // 1. Listener node On Signal
          { id: 'varSigReceiver', type: 'variable_get', pos: { x: 100, y: 150 } },
          { id: 'onSignalNode', type: 'event_on_signal', pos: { x: 350, y: 150 } },
          { 
            id: 'notifReceiver', 
            type: 'ui_notification', 
            pos: { x: 650, y: 150 },
            inspectorValues: { in_msg: { value: 'Signal PlayerDied Received', type: 'string' } },
          },

          // 2. Emitter node dipicu oleh game start
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 350 } },
          { id: 'varSigEmitter', type: 'variable_get', pos: { x: 100, y: 450 } },
          { id: 'emitNode', type: 'action_emit_signal', pos: { x: 350, y: 350 } },
        ],
        variableBindings: [
          { nodeId: 'varSigReceiver', varName: 'sigChannel' },
          { nodeId: 'varSigEmitter', varName: 'sigChannel' },
        ],
        connections: [
          // Alur penerima sinyal
          { source: 'varSigReceiver', sourceHandle: 'out_0', target: 'onSignalNode', targetHandle: 'sig_name' },
          { source: 'onSignalNode', sourceHandle: 'exec_out', target: 'notifReceiver', targetHandle: 'exec_in' },

          // Alur pemancar sinyal
          { source: 'start', sourceHandle: 'out', target: 'emitNode', targetHandle: 'exec_in' },
          { source: 'varSigEmitter', sourceHandle: 'out_0', target: 'emitNode', targetHandle: 'sig_name' },
        ],
        expectedLog: 'Signal PlayerDied Received',
      });
    });

    test('Ignores mismatched signal and does not trigger flow', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'On Signal - Ignore Mismatched Signal',
        entityName: 'SignalFilterEntity',
        scriptName: 'Script_Signal_Mismatch',
        variables: [
          { name: 'listenChannel', type: 'string', value: 'BossDefeated' },
          { name: 'emittedChannel', type: 'string', value: 'CoinCollected' },
        ],
        nodes: [
          // 1. Listener menunggu 'BossDefeated' (tidak boleh terpanggil)
          { id: 'varListen', type: 'variable_get', pos: { x: 100, y: 150 } },
          { id: 'onSignalNode', type: 'event_on_signal', pos: { x: 350, y: 150 } },
          { 
            id: 'notifWrong', 
            type: 'ui_notification', 
            pos: { x: 650, y: 150 },
            inspectorValues: { in_msg: { value: 'Wrong Signal Triggered', type: 'string' } },
          },

          // 2. Emitter memancarkan 'CoinCollected' yang berbeda
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 350 } },
          { id: 'varEmit', type: 'variable_get', pos: { x: 100, y: 450 } },
          { id: 'emitNode', type: 'action_emit_signal', pos: { x: 350, y: 350 } },
          { 
            id: 'notifFallback', 
            type: 'ui_notification', 
            pos: { x: 650, y: 350 },
            inspectorValues: { in_msg: { value: 'Mismatched Succeeded', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varListen', varName: 'listenChannel' },
          { nodeId: 'varEmit', varName: 'emittedChannel' },
        ],
        connections: [
          // Listener
          { source: 'varListen', sourceHandle: 'out_0', target: 'onSignalNode', targetHandle: 'sig_name' },
          { source: 'onSignalNode', sourceHandle: 'exec_out', target: 'notifWrong', targetHandle: 'exec_in' },

          // Emitter diteruskan ke notifFallback
          { source: 'start', sourceHandle: 'out', target: 'emitNode', targetHandle: 'exec_in' },
          { source: 'varEmit', sourceHandle: 'out_0', target: 'emitNode', targetHandle: 'sig_name' },
          { source: 'emitNode', sourceHandle: 'exec_out', target: 'notifFallback', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Mismatched Succeeded',
      });
    });

    test('Handles empty signal name on listener safely without crash', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'On Signal - Empty Listener Guard',
        entityName: 'EmptyListenerEntity',
        scriptName: 'Script_Signal_EmptyListener',
        variables: [
          { name: 'emptySig', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'varSig', type: 'variable_get', pos: { x: 100, y: 150 } },
          { id: 'onSignalNode', type: 'event_on_signal', pos: { x: 350, y: 150 } },
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 300 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 300 },
            inspectorValues: { in_msg: { value: 'Empty Listener Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varSig', varName: 'emptySig' },
        ],
        connections: [
          { source: 'varSig', sourceHandle: 'out_0', target: 'onSignalNode', targetHandle: 'sig_name' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Empty Listener Guard Passed',
      });
    });
  });

});