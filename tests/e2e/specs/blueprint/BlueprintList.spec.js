// lokasi: tests/e2e/blueprint/BlueprintList.spec.js
import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint List Operations E2E',
    description: 'E2E runtime logic evaluation for List manipulation nodes (Get, Set, Push, Insert, Remove, Length, Contains, IndexOf, Concat, Shuffle) in engine preview',
  },
});

test.describe('Blueprint List Operations E2E Testing', () => {
  test('List get - Retrieves element by index', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Get Test',
      entityName: 'ListEntity_Get',
      scriptName: 'Script_ListGet',
      variables: [{ name: 'fruitList', type: 'list', rawJson: ['Apple', 'Banana', 'Cherry'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'listGet',
          type: 'listGet',
          pos: { x: 350, y: 200 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'fruitList' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Banana',
    });
  });

  test('List set - Updates element value at specified index', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Set Test',
      entityName: 'ListEntity_Set',
      scriptName: 'Script_ListSet',
      variables: [{ name: 'colors', type: 'list', rawJson: ['Red', 'Green', 'Blue'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'listSet',
          type: 'listSet',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            index: { value: 1, type: 'number' },
            value: { value: 'Yellow', type: 'string' },
          },
        },
        {
          id: 'listGet',
          type: 'listGet',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'colors' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'listSet', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'listSet', targetHandle: 'list' },
        { source: 'listSet', sourceHandle: 'listOut', target: 'listGet', targetHandle: 'list' },
        { source: 'listSet', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Yellow',
    });
  });

  test('List push - Appends new item to end of list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Push Test',
      entityName: 'ListEntity_Push',
      scriptName: 'Script_ListPush',
      variables: [{ name: 'items', type: 'list', rawJson: ['ItemA', 'ItemB'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'listPush',
          type: 'listPush',
          pos: { x: 350, y: 100 },
          inspectorValues: { value: { value: 'ItemC', type: 'string' } },
        },
        { id: 'lenNode', type: 'listLength', pos: { x: 600, y: 250 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'items' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'listPush', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'listPush', targetHandle: 'list' },
        { source: 'listPush', sourceHandle: 'listOut', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'message' },
        { source: 'listPush', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 3,
    });
  });

  test('List insert - Inserts item at specified index', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Insert Test',
      entityName: 'ListEntity_Insert',
      scriptName: 'Script_ListInsert',
      variables: [{ name: 'numbers', type: 'list', rawJson: [10, 30] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'insertNode',
          type: 'listInsert',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            index: { value: 1, type: 'number' },
            value: { value: 20, type: 'number' },
          },
        },
        {
          id: 'listGet',
          type: 'listGet',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'numbers' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'insertNode', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'insertNode', targetHandle: 'list' },
        { source: 'insertNode', sourceHandle: 'listOut', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
        { source: 'insertNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: '20',
    });
  });

  test('List remove at - Removes item at specified index', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Remove At Test',
      entityName: 'ListEntity_RemoveAt',
      scriptName: 'Script_ListRemoveAt',
      variables: [{ name: 'letters', type: 'list', rawJson: ['X', 'Y', 'Z'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'removeNode',
          type: 'listRemoveAt',
          pos: { x: 350, y: 100 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        {
          id: 'listGet',
          type: 'listGet',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'letters' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'removeNode', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'removeNode', targetHandle: 'list' },
        { source: 'removeNode', sourceHandle: 'listOut', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
        { source: 'removeNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Z',
    });
  });

  test('List length - Measures total elements in list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Length Test',
      entityName: 'ListEntity_Length',
      scriptName: 'Script_ListLength',
      variables: [{ name: 'sampleList', type: 'list', rawJson: [1, 2, 3, 4, 5] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'lenNode', type: 'listLength', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 600, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'sampleList' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 5,
    });
  });

  test('List contains - Checks existence of element in list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Contains Test',
      entityName: 'ListEntity_Contains',
      scriptName: 'Script_ListContains',
      variables: [{ name: 'animals', type: 'list', rawJson: ['Dog', 'Cat', 'Elephant'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'containsNode',
          type: 'listContains',
          pos: { x: 350, y: 200 },
          inspectorValues: { value: { value: 'Cat', type: 'string' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Cat Found', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'animals' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'containsNode', targetHandle: 'list' },
        { source: 'containsNode', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Cat Found',
    });
  });

  test('List index of - Returns index of target value', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Index Of Test',
      entityName: 'ListEntity_IndexOf',
      scriptName: 'Script_ListIndexOf',
      variables: [{ name: 'medals', type: 'list', rawJson: ['Gold', 'Silver', 'Bronze'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'indexOfNode',
          type: 'listIndexOf',
          pos: { x: 350, y: 200 },
          inspectorValues: { value: { value: 'Silver', type: 'string' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 600, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'medals' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'indexOfNode', targetHandle: 'list' },
        { source: 'indexOfNode', sourceHandle: 'index', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 1,
    });
  });

  test('List concat - Merges two lists into a new list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Concat Test',
      entityName: 'ListEntity_Concat',
      scriptName: 'Script_ListConcat',
      variables: [
        { name: 'listA', type: 'list', rawJson: [1, 2] },
        { name: 'listB', type: 'list', rawJson: [3, 4, 5] },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVarA', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'getVarB', type: 'variableGet', pos: { x: 100, y: 400 } },
        { id: 'concatNode', type: 'listConcat', pos: { x: 350, y: 300 } },
        { id: 'lenNode', type: 'listLength', pos: { x: 550, y: 300 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 750, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'getVarA', varName: 'listA' },
        { nodeId: 'getVarB', varName: 'listB' },
      ],
      connections: [
        { source: 'getVarA', sourceHandle: 'value', target: 'concatNode', targetHandle: 'listA' },
        { source: 'getVarB', sourceHandle: 'value', target: 'concatNode', targetHandle: 'listB' },
        { source: 'concatNode', sourceHandle: 'result', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 5,
    });
  });

  test('List shuffle - Shuffles element order while preserving length', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Shuffle Test',
      entityName: 'ListEntity_Shuffle',
      scriptName: 'Script_ListShuffle',
      variables: [{ name: 'deck', type: 'list', rawJson: [10, 20, 30, 40] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'shuffleNode', type: 'listShuffle', pos: { x: 350, y: 100 } },
        { id: 'lenNode', type: 'listLength', pos: { x: 600, y: 250 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'deck' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'shuffleNode', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'shuffleNode', targetHandle: 'list' },
        { source: 'shuffleNode', sourceHandle: 'listOut', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'message' },
        { source: 'shuffleNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 4,
    });
  });
});