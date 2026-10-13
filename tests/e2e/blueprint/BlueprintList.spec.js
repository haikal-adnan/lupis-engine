import { test } from '../fixtures.js';

test.describe('Blueprint List Operations E2E Testing', () => {
  test('1. LIST GET - Mengambil elemen berdasarkan indeks', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Get Test',
      entityName: 'ListEntity_Get',
      scriptName: 'Script_ListGet',
      variables: [{ name: 'fruitList', type: 'list', rawJson: ['Apple', 'Banana', 'Cherry'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'listGet',
          type: 'list_get',
          pos: { x: 350, y: 200 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'fruitList' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Banana',
    });
  });

  test('2. LIST SET - Memperbarui nilai elemen pada indeks tertentu', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Set Test',
      entityName: 'ListEntity_Set',
      scriptName: 'Script_ListSet',
      variables: [{ name: 'colors', type: 'list', rawJson: ['Red', 'Green', 'Blue'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'listSet',
          type: 'list_set',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            index: { value: 1, type: 'number' },
            value: { value: 'Yellow', type: 'string' },
          },
        },
        {
          id: 'listGet',
          type: 'list_get',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'colors' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'listSet', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'listSet', targetHandle: 'list' },
        { source: 'listSet', sourceHandle: 'list_out', target: 'listGet', targetHandle: 'list' },
        { source: 'listSet', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Yellow',
    });
  });

  test('3. LIST PUSH - Menambahkan elemen baru ke akhir list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Push Test',
      entityName: 'ListEntity_Push',
      scriptName: 'Script_ListPush',
      variables: [{ name: 'items', type: 'list', rawJson: ['ItemA', 'ItemB'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'listPush',
          type: 'list_push',
          pos: { x: 350, y: 100 },
          inspectorValues: { value: { value: 'ItemC', type: 'string' } },
        },
        { id: 'lenNode', type: 'list_length', pos: { x: 600, y: 250 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'items' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'listPush', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'listPush', targetHandle: 'list' },
        { source: 'listPush', sourceHandle: 'list_out', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'listPush', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 3,
    });
  });

  test('4. LIST INSERT - Menyisipkan elemen pada indeks tengah', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Insert Test',
      entityName: 'ListEntity_Insert',
      scriptName: 'Script_ListInsert',
      variables: [{ name: 'numbers', type: 'list', rawJson: [10, 30] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'insertNode',
          type: 'list_insert',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            index: { value: 1, type: 'number' },
            value: { value: 20, type: 'number' },
          },
        },
        {
          id: 'listGet',
          type: 'list_get',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'numbers' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'insertNode', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'insertNode', targetHandle: 'list' },
        { source: 'insertNode', sourceHandle: 'list_out', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
        { source: 'insertNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: '20',
    });
  });

  test('5. LIST REMOVE AT - Menghapus elemen pada indeks tertentu', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Remove At Test',
      entityName: 'ListEntity_RemoveAt',
      scriptName: 'Script_ListRemoveAt',
      variables: [{ name: 'letters', type: 'list', rawJson: ['X', 'Y', 'Z'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'removeNode',
          type: 'list_remove_at',
          pos: { x: 350, y: 100 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        {
          id: 'listGet',
          type: 'list_get',
          pos: { x: 600, y: 250 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'letters' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'removeNode', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'removeNode', targetHandle: 'list' },
        { source: 'removeNode', sourceHandle: 'list_out', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
        { source: 'removeNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Z',
    });
  });

  test('6. LIST LENGTH - Mengukur jumlah total elemen dalam list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Length Test',
      entityName: 'ListEntity_Length',
      scriptName: 'Script_ListLength',
      variables: [{ name: 'sampleList', type: 'list', rawJson: [1, 2, 3, 4, 5] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'lenNode', type: 'list_length', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 600, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'sampleList' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 5,
    });
  });

  test('7. LIST CONTAINS - Memeriksa keberadaan elemen dalam list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Contains Test',
      entityName: 'ListEntity_Contains',
      scriptName: 'Script_ListContains',
      variables: [{ name: 'animals', type: 'list', rawJson: ['Dog', 'Cat', 'Elephant'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'containsNode',
          type: 'list_contains',
          pos: { x: 350, y: 200 },
          inspectorValues: { value: { value: 'Cat', type: 'string' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Cat Found', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'animals' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'containsNode', targetHandle: 'list' },
        { source: 'containsNode', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Cat Found',
    });
  });

  test('8. LIST INDEX OF - Mengembalikan indeks posisi nilai yang dicari', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Index Of Test',
      entityName: 'ListEntity_IndexOf',
      scriptName: 'Script_ListIndexOf',
      variables: [{ name: 'medals', type: 'list', rawJson: ['Gold', 'Silver', 'Bronze'] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'indexOfNode',
          type: 'list_index_of',
          pos: { x: 350, y: 200 },
          inspectorValues: { value: { value: 'Silver', type: 'string' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 600, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'medals' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'indexOfNode', targetHandle: 'list' },
        { source: 'indexOfNode', sourceHandle: 'index', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 1,
    });
  });

  test('9. LIST CONCAT - Menggabungkan dua list menjadi satu list baru', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Concat Test',
      entityName: 'ListEntity_Concat',
      scriptName: 'Script_ListConcat',
      variables: [
        { name: 'listA', type: 'list', rawJson: [1, 2] },
        { name: 'listB', type: 'list', rawJson: [3, 4, 5] },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVarA', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'getVarB', type: 'variable_get', pos: { x: 100, y: 400 } },
        { id: 'concatNode', type: 'list_concat', pos: { x: 350, y: 300 } },
        { id: 'lenNode', type: 'list_length', pos: { x: 550, y: 300 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 750, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'getVarA', varName: 'listA' },
        { nodeId: 'getVarB', varName: 'listB' },
      ],
      connections: [
        { source: 'getVarA', sourceHandle: 'out_0', target: 'concatNode', targetHandle: 'list_a' },
        { source: 'getVarB', sourceHandle: 'out_0', target: 'concatNode', targetHandle: 'list_b' },
        { source: 'concatNode', sourceHandle: 'result_list', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 5,
    });
  });

  test('10. LIST SHUFFLE - Mengacak susunan list tanpa mengubah panjang elemen', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Shuffle Test',
      entityName: 'ListEntity_Shuffle',
      scriptName: 'Script_ListShuffle',
      variables: [{ name: 'deck', type: 'list', rawJson: [10, 20, 30, 40] }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'shuffleNode', type: 'list_shuffle', pos: { x: 350, y: 100 } },
        { id: 'lenNode', type: 'list_length', pos: { x: 600, y: 250 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'deck' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'shuffleNode', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'shuffleNode', targetHandle: 'list' },
        { source: 'shuffleNode', sourceHandle: 'list_out', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'shuffleNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 4,
    });
  });
});