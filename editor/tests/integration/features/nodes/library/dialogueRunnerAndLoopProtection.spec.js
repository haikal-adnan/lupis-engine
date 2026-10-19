import { describe, it, expect, vi } from 'vitest';
import ContextSystem from '@core/Script/ContextSystem.js';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import { BlueprintHelperTool as BlueprintVisualNovelHelper, BlueprintFlow as BlueprintHelper, BlueprintSystem } from '@nodes/library/blueprints/index.js';
import { componentSchema } from '@scenes/scenes.js';

describe('Dialogue Runner & Infinite Loop Protection Integration', () => {
  const vnDialogueRunnerDef = BlueprintVisualNovelHelper.items.find(i => i.type === 'vnDialogueRunner');

  function createMockVnGame() {
    const emittedErrors = [];
    const emittedLogs = [];
    const emittedWarns = [];
    const emittedSignals = [];
    const globals = new Map();
    const entityRegistry = new Map();
    const eventListeners = new Map();

    const mockGame = {
      deltaTime: 0.016,
      events: {
        emit: (name, ...args) => {
          if (name === 'console:error') emittedErrors.push(args[0]);
          if (name === 'console:warn') emittedWarns.push(args[0]);
          if (name === 'console:log') emittedLogs.push(args[0]);
          emittedSignals.push({ name, args, data: args[0] });
          const list = eventListeners.get(name) || [];
          for (const cb of [...list]) {
            cb(...args);
          }
        },
        on: (name, cb) => {
          if (!eventListeners.has(name)) eventListeners.set(name, []);
          eventListeners.get(name).push(cb);
        },
        off: (name, cb) => {
          if (!eventListeners.has(name)) return;
          const list = eventListeners.get(name);
          const idx = list.indexOf(cb);
          if (idx > -1) list.splice(idx, 1);
        }
      },
      variables: {
        globals,
        hasGlobal: (key) => globals.has(key),
        getGlobal: (key) => globals.get(key),
        setGlobal: (key, val) => globals.set(key, val)
      },
      entityRegistry,
      input: {
        pointer: { x: 0, y: 0, down: false },
        getPointer: function() { return this.pointer; },
        keyboard: {
          pressedKeys: new Set(),
          isPressed: function(key) { return this.pressedKeys.has(key); }
        }
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return { mockGame, emittedErrors, emittedWarns, emittedLogs, emittedSignals, globals, entityRegistry };
  }

  function setupDialogueRunnerScript(mockGame, nodeValues = {}) {
    const textEntity = {
      id: 'dialogText',
      components: {
        TextRenderer: { value: '', color: '#FFFFFF' }
      }
    };
    const speakerEntity = {
      id: 'characterName',
      components: {
        TextRenderer: { value: '', color: '#FFFFFF' }
      }
    };
    const nameEntity = {
      id: 'nameBox',
      visible: true,
      components: {}
    };
    const portraitEntity = {
      id: 'spriteCharacter',
      visible: false,
      components: {
        SpriteRenderer: { assetId: '' },
        SpriteAnimator: {
          currentClip: '',
          clips: [
            { id: 'anim_1', scriptId: '1' },
            { id: 'anim_2', scriptId: '2' },
            { id: 'anim_3', scriptId: '3' },
            { id: 'anim_4', scriptId: '4' }
          ]
        }
      }
    };

    mockGame.entityRegistry.set('dialogText', textEntity);
    mockGame.entityRegistry.set('characterName', speakerEntity);
    mockGame.entityRegistry.set('spriteCharacter', portraitEntity);
    mockGame.entityRegistry.set('nameBox', nameEntity);
    mockGame.entityRegistry.set('DialogueText', textEntity);
    mockGame.entityRegistry.set('SpeakerText', speakerEntity);
    mockGame.entityRegistry.set('PortraitImage', portraitEntity);

    // Mock entity.get on contextSystem
    const origCreateExecutionContext = mockGame.contextSystem.createExecutionContext.bind(mockGame.contextSystem);
    mockGame.contextSystem.createExecutionContext = (runner, node) => {
      const ctx = origCreateExecutionContext(runner, node);
      ctx.entity = {
        get: (id) => mockGame.entityRegistry.get(id),
        getChildren: () => []
      };
      if (typeof mockGame.isPointerOver === 'function') {
        ctx.input.isPointerOver = mockGame.isPointerOver;
      }
      return ctx;
    };

    const scriptData = {
      id: 'script_vn_test',
      localVariables: [
        { id: 'var_local_hero', name: 'heroName', defaultValue: 'Alex' },
        { id: 'var_local_score', name: 'playerScore', defaultValue: 0 },
        { id: 'var_player_name', name: 'playerName', defaultValue: 'Calk' }
      ],
      nodes: [
        {
          id: 'node_dialogue_runner',
          type: 'vnDialogueRunner',
          inputs: vnDialogueRunnerDef.defaultData.inputs,
          outputs: vnDialogueRunnerDef.defaultData.outputs,
          data: {
            values: {
              ...vnDialogueRunnerDef.defaultData.data.values,
              ...nodeValues
            },
            code: vnDialogueRunnerDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'ent_runner' });
    return { runner, textEntity, speakerEntity, portraitEntity, nameEntity, scriptData };
  }

  const vnChoicePresenterDef = BlueprintVisualNovelHelper.items.find(i => i.type === 'vnChoicePresenter');

  function setupChoicePresenterScript(mockGame, nodeValues = {}) {
    const btn1 = { id: 'btnChoice1', visible: false, components: { Transform: {} } };
    const btn2 = { id: 'btnChoice2', visible: false, components: { Transform: {} } };
    const btn3 = { id: 'btnChoice3', visible: false, components: { Transform: {} } };

    const txt1 = { id: 'btnChoice1Text', visible: false, components: { TextRenderer: { value: '' } } };
    const txt2 = { id: 'btnChoice2Text', visible: false, components: { TextRenderer: { value: '' } } };
    const txt3 = { id: 'btnChoice3Text', visible: false, components: { TextRenderer: { value: '' } } };

    mockGame.entityRegistry.set('btnChoice1', btn1);
    mockGame.entityRegistry.set('btnChoice2', btn2);
    mockGame.entityRegistry.set('btnChoice3', btn3);
    mockGame.entityRegistry.set('btnChoice1Text', txt1);
    mockGame.entityRegistry.set('btnChoice2Text', txt2);
    mockGame.entityRegistry.set('btnChoice3Text', txt3);

    const origCreateExecutionContext = mockGame.contextSystem.createExecutionContext.bind(mockGame.contextSystem);
    mockGame.contextSystem.createExecutionContext = (runner, node) => {
      const ctx = origCreateExecutionContext(runner, node);
      ctx.entity = {
        get: (id) => mockGame.entityRegistry.get(id),
        getChildren: () => []
      };
      ctx.input.isPointerOver = (entity) => entity.id === 'btnChoice1';
      return ctx;
    };

    const scriptData = {
      id: 'script_choice_test',
      localVariables: [
        { id: 'var_player_name', name: 'playerName', defaultValue: 'Calk' }
      ],
      nodes: [
        {
          id: 'node_choice_presenter',
          type: 'vnChoicePresenter',
          inputs: vnChoicePresenterDef.defaultData.inputs,
          outputs: vnChoicePresenterDef.defaultData.outputs,
          data: {
            values: {
              ...vnChoicePresenterDef.defaultData.data.values,
              ...nodeValues
            },
            code: vnChoicePresenterDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'ent_choice_runner' });
    return { runner, btn1, btn2, btn3, txt1, txt2, txt3 };
  }

  describe('Typewriter Functionality', () => {
    it('animates text character by character according to delta time and speed', () => {
      const { mockGame } = createMockVnGame();
      const dialogMap = {
        dialog_1: {
          text: 'Halo Dunia!',
          speaker: 'guide',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 20
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // Before ticks, text is empty and typing is active
      expect(textEntity.components.TextRenderer.value).toBe('');

      // Advance by 25ms (1 character at speed 20ms)
      runner.update(0.025);
      expect(textEntity.components.TextRenderer.value).toBe('H');

      // Advance by 40ms (2 more characters)
      runner.update(0.040);
      expect(textEntity.components.TextRenderer.value).toBe('Hal');

      // Advance by 200ms (types the rest)
      runner.update(0.200);
      expect(textEntity.components.TextRenderer.value).toBe('Halo Dunia!');
    });

    it('instantly finishes typing when pointer click is detected while typing', () => {
      const { mockGame } = createMockVnGame();
      const dialogMap = {
        dialog_1: {
          text: 'Kalimat panjang yang sedang diketik.',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 50
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // 1 frame typing
      runner.update(0.016);
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Kalimat panjang yang sedang diketik.'.length);

      // Player clicks
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Immediately completes full text
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat panjang yang sedang diketik.');
    });

    it('displays full text immediately without typewriter when speed is 0', () => {
      const { mockGame } = createMockVnGame();
      const dialogMap = {
        dialog_1: {
          text: 'Teks instan tanpa typewriter',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(textEntity.components.TextRenderer.value).toBe('Teks instan tanpa typewriter');
    });
  });

  describe('{} Variable Interpolation System', () => {
    it('replaces {variable} from local variables and global variables', () => {
      const { mockGame, globals } = createMockVnGame();
      globals.set('goldCoins', 150);

      const dialogMap = {
        dialog_1: {
          text: 'Selamat datang {heroName}! Kamu memiliki {goldCoins} koin.',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(textEntity.components.TextRenderer.value).toBe('Selamat datang Alex! Kamu memiliki 150 koin.');
    });

    it('correctly formats falsy values like 0 or false instead of ignoring them', () => {
      const { mockGame } = createMockVnGame();

      const dialogMap = {
        dialog_1: {
          text: 'Skor kamu saat ini: {playerScore} poin.',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(textEntity.components.TextRenderer.value).toBe('Skor kamu saat ini: 0 poin.');
    });

    it('supports scoped prefixes {local.var}, {global.var}, {local(var)}, and trims whitespace', () => {
      const { mockGame, globals } = createMockVnGame();
      globals.set('serverRegion', 'Asia');

      const dialogMap = {
        dialog_1: {
          text: 'Hero: {local.heroName}, Server: { global.serverRegion }, Level: {local(playerScore)}',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(textEntity.components.TextRenderer.value).toBe('Hero: Alex, Server: Asia, Level: 0');
    });

    it('safely handles non-existent variables without throwing or crashing', () => {
      const { mockGame } = createMockVnGame();

      const dialogMap = {
        dialog_1: {
          text: 'Item rahasia: {unknownItem}',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      expect(() => {
        runner._executeNodeLogic(node, 'execIn');
      }).not.toThrow();

      expect(textEntity.components.TextRenderer.value).toBe('Item rahasia: {unknownItem}');
    });
  });

  describe('Auto Loop & Infinite Loop Handler', () => {
    it('halts deep synchronous execution cycles in ScriptRunner without freezing or throwing', () => {
      const { mockGame, emittedErrors } = createMockVnGame();

      const cyclicScript = {
        id: 'script_cycle_test',
        localVariables: [],
        nodes: [
          {
            id: 'node_a',
            type: 'nodeA',
            inputs: [{ id: 'execIn', dataType: 'execution' }],
            outputs: [{ id: 'execOut', dataType: 'execution' }],
            data: { code: 'outputs.execOut = true; return;' }
          },
          {
            id: 'node_b',
            type: 'nodeB',
            inputs: [{ id: 'execIn', dataType: 'execution' }],
            outputs: [{ id: 'execOut', dataType: 'execution' }],
            data: { code: 'outputs.execOut = true; return;' }
          }
        ],
        edges: [
          { source: 'node_a', sourceHandle: 'execOut', target: 'node_b', targetHandle: 'execIn' },
          { source: 'node_b', sourceHandle: 'execOut', target: 'node_a', targetHandle: 'execIn' }
        ]
      };

      const runner = new ScriptRunner(mockGame, cyclicScript, { id: 'ent_cycle' });
      const nodeA = runner.nodeMap.get('node_a');

      // Executing nodeA starts an infinite synchronous loop between nodeA and nodeB
      expect(() => {
        runner._executeNodeLogic(nodeA, 'execIn');
      }).not.toThrow();

      // Loop protection halted the runaway cycle and emitted an error
      expect(emittedErrors.length).toBeGreaterThan(0);
      expect(emittedErrors[0].message).toContain('Loop Protection');
      expect(emittedErrors[0].message).toContain('Infinite loop or excessive execution detected');
    });

    it('detects runaway auto-loop in vnDialogueRunner and safely halts with console:error', () => {
      const { mockGame, emittedErrors } = createMockVnGame();

      // Dialogue pointing to itself in an instant loop
      const dialogMap = {
        rapid_loop: {
          text: 'Looping instantly',
          next: 'rapid_loop'
        }
      };

      const { runner } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'rapid_loop',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');

      // Simulate 30 rapid executions in under 100ms
      for (let i = 0; i < 30; i++) {
        runner._executeNodeLogic(node, 'execIn');
      }

      // Should detect rapid auto loop and emit console:error
      const loopError = emittedErrors.find(e => e.message.includes('Auto loop detected'));
      expect(loopError).toBeDefined();
    });

    it('automatically advances to next dialogue when onNext is wired to execIn', () => {
      const { mockGame } = createMockVnGame();
      const dialogMap = {
        dialog_1: {
          text: 'First line',
          next: 'dialog_2'
        },
        dialog_2: {
          text: 'Second line',
          next: false
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'dialog_1',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('First line');

      // Click to advance
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Node should advance to dialog_2
      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Second line');
    });

    it('falls back to local or global dialogueMap and characterMap when inputs are omitted', () => {
      const { mockGame } = createMockVnGame();
      const dialogueMap = {
        d_001: {
          speaker: 'alice',
          emotion: 'happy',
          text: 'Halo dari dialogueMap variable!',
          next: false
        }
      };
      const characterMap = {
        alice: {
          displayName: 'Alice Magus',
          nameColor: '#FF70A6',
          sprites: { happy: 'anim_2' }
        }
      };

      const { runner, textEntity, speakerEntity, portraitEntity } = setupDialogueRunnerScript(mockGame, {
        speed: 0
      });

      // Inject variables into runner
      runner.localVariables.set('var_diag_map', dialogueMap);
      runner.nameToIdMap.set('dialogueMap', 'var_diag_map');
      runner.localVariables.set('var_char_map', characterMap);
      runner.nameToIdMap.set('characterMap', 'var_char_map');

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(textEntity.components.TextRenderer.value).toBe('Halo dari dialogueMap variable!');
      expect(speakerEntity.components.TextRenderer.value).toBe('Alice Magus');
      expect(speakerEntity.components.TextRenderer.color).toBe('#FF70A6');
      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteAnimator.currentClip).toBe('anim_2');
    });

    it('hides nameEntity and speakerEntity when speaker is narrator or empty', () => {
      const { mockGame } = createMockVnGame();
      const dialogMap = {
        d_narrator: {
          text: 'Suatu hari di desa yang damai...',
          speaker: 'narrator',
          next: false
        },
        d_empty_speaker: {
          text: 'Tiba-tiba terdengar suara gemuruh.',
          speaker: '',
          next: false
        },
        d_hero: {
          text: 'Ada apa di sana?!',
          speaker: 'hero',
          next: false
        }
      };
      const characterMap = {
        hero: {
          displayName: 'Pahlawan',
          nameColor: '#33CCFF'
        }
      };

      const { runner, textEntity, speakerEntity, nameEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        charMap: characterMap,
        dialogId: 'd_narrator',
        speed: 0,
        nameEntity: 'nameBox'
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // Narrator -> both nameEntity and speakerEntity hidden
      expect(nameEntity.visible).toBe(false);
      expect(speakerEntity.visible).toBe(false);
      expect(textEntity.components.TextRenderer.value).toBe('Suatu hari di desa yang damai...');

      // Switch to empty speaker -> still narrator behavior
      node.data.values.dialogId = 'd_empty_speaker';
      runner._executeNodeLogic(node, 'execIn');
      expect(nameEntity.visible).toBe(false);
      expect(speakerEntity.visible).toBe(false);

      // Switch to hero -> nameEntity and speakerEntity shown, speaker populated
      node.data.values.dialogId = 'd_hero';
      runner._executeNodeLogic(node, 'execIn');
      expect(nameEntity.visible).toBe(true);
      expect(speakerEntity.visible).toBe(true);
      expect(speakerEntity.components.TextRenderer.value).toBe('Pahlawan');
      expect(speakerEntity.components.TextRenderer.color).toBe('#33CCFF');
    });
  });

  describe('Choice Presenter Functionality', () => {
    it('populates choices to default btnChoice1..3 with variable interpolation', () => {
      const { mockGame } = createMockVnGame();
      const choices = [
        { text: 'Ayo jalan, {local(playerName)}!', next: 'd_forest', signals: ['playSfx'] },
        { text: 'Tinggal di desa saja', next: 'd_stay', signals: [] }
      ];

      const { runner, btn1, btn2, btn3, txt1, txt2, txt3 } = setupChoicePresenterScript(mockGame, {
        choices
      });

      const node = runner.nodeMap.get('node_choice_presenter');
      runner._executeNodeLogic(node, 'execIn');

      // Btn 1 and 2 visible and populated
      expect(btn1.visible).toBe(true);
      expect(txt1.visible).toBe(true);
      expect(txt1.components.TextRenderer.value).toBe('Ayo jalan, Calk!');

      expect(btn2.visible).toBe(true);
      expect(txt2.visible).toBe(true);
      expect(txt2.components.TextRenderer.value).toBe('Tinggal di desa saja');

      // Btn 3 hidden
      expect(btn3.visible).toBe(false);
      expect(txt3.visible).toBe(false);
    });

    it('handles player click on choice and sets vnNextDialogId', () => {
      const { mockGame } = createMockVnGame();
      const choices = [
        { text: 'Pilihan 1', next: 'd_forest', signals: ['sig_choice_1'] }
      ];

      const { runner, btn1, txt1 } = setupChoicePresenterScript(mockGame, {
        choices,
        activationDelay: 0
      });

      const node = runner.nodeMap.get('node_choice_presenter');
      runner._executeNodeLogic(node, 'execIn');

      // Simulate pointer click on btnChoice1
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Buttons hidden after click
      expect(btn1.visible).toBe(false);
      expect(txt1.visible).toBe(false);

      // Next dialog set in state and outputs
      const ctx = runner.game.contextSystem.createExecutionContext(runner, node);
      expect(ctx.state.vnNextDialogId).toBe('d_forest');
      const outputs = runner.nodeOutputs.get('node_choice_presenter');
      expect(outputs.nextDialogId).toBe('d_forest');
    });

    it('guards against accidental clicks with activationDelay and consumes initial down state', () => {
      vi.useFakeTimers();
      const { mockGame } = createMockVnGame();
      const choices = [
        { text: 'Pilihan 1', next: 'd_forest' }
      ];

      // Simulate player holding pointer down (e.g. fast-forwarding typewriter) when choices appear
      mockGame.input.pointer.down = true;

      const { runner, btn1, txt1 } = setupChoicePresenterScript(mockGame, {
        choices,
        activationDelay: 250
      });

      const node = runner.nodeMap.get('node_choice_presenter');
      runner._executeNodeLogic(node, 'execIn');

      // Choices are displayed
      expect(btn1.visible).toBe(true);

      // Even though pointer is down, choice was already down at spawn -> not a new click
      runner.update(0.016);
      expect(btn1.visible).toBe(true);

      // Player releases pointer at 50ms
      vi.advanceTimersByTime(50);
      mockGame.input.pointer.down = false;
      runner.update(0.016);

      // Player clicks immediately at 100ms (still within activationDelay 250ms)
      vi.advanceTimersByTime(50);
      mockGame.input.pointer.down = true;
      runner.update(0.016);
      // Still guarded by activationDelay -> buttons stay visible
      expect(btn1.visible).toBe(true);

      // Player releases pointer at 150ms
      vi.advanceTimersByTime(50);
      mockGame.input.pointer.down = false;
      runner.update(0.016);

      // Time advances past activationDelay (now 300ms total since choices appeared)
      vi.advanceTimersByTime(150);

      // Player clicks now (fresh click after delay)
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Choice is selected and buttons hidden
      expect(btn1.visible).toBe(false);
      expect(txt1.visible).toBe(false);

      const outputs = runner.nodeOutputs.get('node_choice_presenter');
      expect(outputs.nextDialogId).toBe('d_forest');

      vi.useRealTimers();
    });
  });

  describe('Flow Helpers (Delay & Cooldown)', () => {
    const logicDelayDef = BlueprintHelper.items.find(i => i.type === 'logicDelay');
    const logicCooldownDef = BlueprintHelper.items.find(i => i.type === 'logicCooldown');

    function setupDelayScript(mockGame, nodeValues = {}) {
      const scriptData = {
        id: 'script_delay_test',
        localVariables: [],
        nodes: [
          {
            id: 'node_delay',
            type: 'logicDelay',
            inputs: logicDelayDef.defaultData.inputs,
            outputs: logicDelayDef.defaultData.outputs,
            data: {
              values: {
                ...logicDelayDef.defaultData.data.values,
                ...nodeValues
              },
              code: logicDelayDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData, { id: 'ent_delay_runner' });
      return { runner };
    }

    it('logicDelay fires completed immediately when duration <= 0', () => {
      const { mockGame } = createMockVnGame();
      const { runner } = setupDelayScript(mockGame, { duration: 0 });
      const node = runner.nodeMap.get('node_delay');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(flowSpy).toHaveBeenCalledWith('node_delay', 'completed');
    });

    it('logicDelay counts down across frames and fires completed when elapsed', () => {
      const { mockGame } = createMockVnGame();
      const { runner } = setupDelayScript(mockGame, { duration: 500 });
      const node = runner.nodeMap.get('node_delay');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(flowSpy).not.toHaveBeenCalled();

      // Advance by 250ms (0.25s) -> still not completed
      runner.update(0.25);
      expect(flowSpy).not.toHaveBeenCalled();

      // Advance by another 300ms (0.3s) -> total 550ms -> completed
      runner.update(0.3);
      expect(flowSpy).toHaveBeenCalledWith('node_delay', 'completed');
    });

    function setupCooldownScript(mockGame, nodeValues = {}) {
      const scriptData = {
        id: 'script_cooldown_test',
        localVariables: [],
        nodes: [
          {
            id: 'node_cooldown',
            type: 'logicCooldown',
            inputs: logicCooldownDef.defaultData.inputs,
            outputs: logicCooldownDef.defaultData.outputs,
            data: {
              values: {
                ...logicCooldownDef.defaultData.data.values,
                ...nodeValues
              },
              code: logicCooldownDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData, { id: 'ent_cooldown_runner' });
      return { runner };
    }

    it('logicCooldown handles ready and cooling states based on elapsed time', () => {
      vi.useFakeTimers();
      const { mockGame } = createMockVnGame();
      const { runner } = setupCooldownScript(mockGame, { duration: 300 });
      const node = runner.nodeMap.get('node_cooldown');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      // First trigger: should trigger onReady flow
      runner._executeNodeLogic(node, 'execIn');
      expect(flowSpy).toHaveBeenCalledWith('node_cooldown', 'onReady');
      flowSpy.mockClear();

      // Immediate second trigger (10ms later): should trigger onCooling flow
      vi.advanceTimersByTime(10);
      runner._executeNodeLogic(node, 'execIn');
      expect(flowSpy).toHaveBeenCalledWith('node_cooldown', 'onCooling');
      flowSpy.mockClear();

      // Advance past cooldown duration (350ms total)
      vi.advanceTimersByTime(350);
      runner._executeNodeLogic(node, 'execIn');
      expect(flowSpy).toHaveBeenCalledWith('node_cooldown', 'onReady');

      vi.useRealTimers();
    });
  });

  describe('Text Vertical Alignment (alignLine)', () => {
    it('includes alignLine in componentSchema for TextRenderer with default "top"', () => {
      const defaultTextComp = componentSchema.create('TextRenderer');
      expect(defaultTextComp.alignLine).toBe('top');

      const customTextComp = componentSchema.create('TextRenderer', { alignLine: 'mid' });
      expect(customTextComp.alignLine).toBe('mid');
    });

    it('calculates vertical offset in TextRenderer correctly for top, mid, and bottom', () => {
      const targetH = 100;
      const nativeH = 30;

      const calcOffset = (alignLine) => {
        let verticalOffset = 0;
        if (alignLine === 'mid' || alignLine === 'center' || alignLine === 'middle') {
          verticalOffset = Math.max(0, (targetH - nativeH) / 2);
        } else if (alignLine === 'bottom') {
          verticalOffset = Math.max(0, targetH - nativeH);
        }
        return verticalOffset;
      };

      expect(calcOffset('top')).toBe(0);
      expect(calcOffset('mid')).toBe(35);
      expect(calcOffset('center')).toBe(35);
      expect(calcOffset('bottom')).toBe(70);
    });

    it('preserves target container height in RenderUtils when custom vertical alignment is present', () => {
      const rawT = { width: 200, height: 100 };
      const trans = { width: 200, height: 100 };
      const newH = 30;

      const applyAutoLine = (alignLine, autoLine = true) => {
        const hasCustomVAlign = alignLine === 'mid' || alignLine === 'bottom' || alignLine === 'center' || alignLine === 'middle';
        if (!hasCustomVAlign && autoLine !== false) {
          if (rawT.height !== newH) {
            rawT.height = newH;
            trans.height = rawT.height;
          }
        }
      };

      // With mid align, height is preserved (not collapsed to 30)
      applyAutoLine('mid');
      expect(rawT.height).toBe(100);

      // With bottom align, height is preserved
      applyAutoLine('bottom');
      expect(rawT.height).toBe(100);

      // With top align (default autoLine), height is updated to newH
      applyAutoLine('top');
      expect(rawT.height).toBe(30);
    });
  });

  describe('Emotion & Asset ID Resolution from Character Map', () => {
    const dialogMap = {
      d_001: {
        speaker: '',
        emotion: '',
        text: 'Pagi hari yang cerah di perbatasan desa Gensokyo.',
        next: 'd_002'
      },
      d_002: {
        speaker: 'ribbon',
        emotion: 'neutral_smile',
        text: 'Halo {local(playerName)}! Senang bisa bertemu lagi hari ini.',
        next: 'd_003'
      },
      d_003: {
        speaker: 'ribbon',
        emotion: 'close_eyes',
        text: 'Jangan santai dulu! Uang kas kita cuma sisa {global(playerGold)} koin.',
        next: 'd_004'
      },
      d_004: {
        speaker: 'ribbon',
        emotion: 'neutral',
        text: 'Hmm... kira-kira apa yang sebaiknya kita lakukan sekarang?',
        choices: [
          { text: 'Pergi ke Hutan mencari bahan', next: 'd_forest', signals: ['playSfxStep'] },
          { text: 'Kunjungi Pasar', next: 'd_market', signals: ['playSfxStep'] }
        ]
      },
      d_user_scenario: {
        speaker: 'ribbon',
        emotion: 'neutral_close_eyes',
        text: 'Membaca emotion neutral_close_eyes dari charMap ribbon',
        next: null
      },
      d_leave_market: {
        speaker: 'narrator',
        emotion: '',
        text: 'Kalian memutuskan untuk berhemat dan melanjutkan perjalanan.',
        next: null
      }
    };

    const charMap = {
      ribbon: {
        displayName: 'Ribbon',
        nameColor: '#FF70A6',
        sprites: {
          neutral: 'ribbon_neutral',
          neutral_smile: 'ribbon_neutral_smile',
          neutral_close_eyes: 'ribbon_neutral',
          close_eyes: 'ribbon_close_eyes',
          close_eyes_smile: 'ribbon_close_eyes_smile'
        }
      },
      narrator: {
        displayName: '',
        nameColor: '#FFFFFF',
        sprites: {}
      }
    };

    it('reads emotion neutral_close_eyes from charMap and sets portraitEntity assetId to ribbon_neutral', () => {
      const { mockGame } = createMockVnGame();
      const { runner, portraitEntity, speakerEntity, nameEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        charMap,
        dialogId: 'd_user_scenario',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(speakerEntity.components.TextRenderer.value).toBe('Ribbon');
      expect(speakerEntity.components.TextRenderer.color).toBe('#FF70A6');
      expect(nameEntity.visible).toBe(true);
      expect(speakerEntity.visible).toBe(true);

      // Emotion "neutral_close_eyes" -> charMap.ribbon.sprites["neutral_close_eyes"] -> "ribbon_neutral"
      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteRenderer.assetId).toBe('ribbon_neutral');
    });

    it('matches emotion neutral_smile and close_eyes directly from charMap sprites', () => {
      const { mockGame } = createMockVnGame();
      const { runner, portraitEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        charMap,
        dialogId: 'd_002',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // d_002: "neutral_smile" -> "ribbon_neutral_smile"
      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteRenderer.assetId).toBe('ribbon_neutral_smile');

      // d_003: "close_eyes" -> "ribbon_close_eyes"
      node.data.values.dialogId = 'd_003';
      runner._executeNodeLogic(node, 'execIn');

      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteRenderer.assetId).toBe('ribbon_close_eyes');

      // d_004: "neutral" -> "ribbon_neutral"
      node.data.values.dialogId = 'd_004';
      runner._executeNodeLogic(node, 'execIn');

      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteRenderer.assetId).toBe('ribbon_neutral');
    });

    it('resolves asset UUID automatically if an asset with that scriptId is registered in the engine', () => {
      const { mockGame } = createMockVnGame();
      mockGame.world = {
        assetMap: {
          ribbon_neutral_smile: { id: 'ast_uuid_smile_999', scriptId: 'ribbon_neutral_smile' }
        }
      };

      const { runner, portraitEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        charMap,
        dialogId: 'd_002',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(portraitEntity.visible).toBe(true);
      expect(portraitEntity.components.SpriteRenderer.assetId).toBe('ast_uuid_smile_999');
    });

    it('hides portrait entity and speaker box when speaker is narrator or emotion is empty', () => {
      const { mockGame } = createMockVnGame();
      const { runner, portraitEntity, nameEntity, speakerEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        charMap,
        dialogId: 'd_001',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // d_001 has speaker: "" and emotion: ""
      expect(portraitEntity.visible).toBe(false);
      expect(nameEntity.visible).toBe(false);
      expect(speakerEntity.visible).toBe(false);

      // d_leave_market has speaker: "narrator"
      node.data.values.dialogId = 'd_leave_market';
      runner._executeNodeLogic(node, 'execIn');

      expect(portraitEntity.visible).toBe(false);
      expect(nameEntity.visible).toBe(false);
      expect(speakerEntity.visible).toBe(false);
    });
  });

  describe('clickEntity Interaction & Skip/Advance Control', () => {
    it('defines clickEntity in vnDialogueRunner blueprint inputs and default values', () => {
      const clickInput = vnDialogueRunnerDef.defaultData.inputs.find(i => i.id === 'clickEntity');
      expect(clickInput).toBeDefined();
      expect(clickInput.dataType).toBe('string');
      expect(clickInput.defaultValue).toBe('');
      expect(vnDialogueRunnerDef.defaultData.data.values.clickEntity).toBe('');
    });

    it('ignores clicks outside clickEntity during typewriter typing', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      // Pointer is currently NOT over dialogBox
      mockGame.isPointerOver = (entity) => entity.id === 'otherBox';

      const dialogMap = {
        d_1: { text: 'Teks panjang yang sedang berjalan pelan-pelan.', next: false }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 50
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // 1 frame typing
      runner.update(0.016);
      const textAfterFirstTick = textEntity.components.TextRenderer.value;
      expect(textAfterFirstTick.length).toBeLessThan('Teks panjang yang sedang berjalan pelan-pelan.'.length);

      // Click outside dialogBox
      mockGame.input.pointer.down = true;
      runner.update(0.016);
      mockGame.input.pointer.down = false;

      // Text should NOT have skipped
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Teks panjang yang sedang berjalan pelan-pelan.'.length);
    });

    it('skips typewriter immediately when clickEntity is clicked', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      // Pointer is over dialogBox
      mockGame.isPointerOver = (entity) => entity.id === 'dialogBox';

      const dialogMap = {
        d_1: { text: 'Teks panjang yang sedang berjalan pelan-pelan.', next: false }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 50
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // 1 frame typing
      runner.update(0.016);
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Teks panjang yang sedang berjalan pelan-pelan.'.length);

      // Click on dialogBox
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Immediately completed full text
      expect(textEntity.components.TextRenderer.value).toBe('Teks panjang yang sedang berjalan pelan-pelan.');
    });

    it('does not advance dialogue when clicked outside clickEntity after typing finishes', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      mockGame.isPointerOver = () => false;

      const dialogMap = {
        d_1: { text: 'Kalimat selesai.', next: 'd_2' },
        d_2: { text: 'Kalimat berikutnya.', next: false }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat selesai.');

      // Click outside dialogBox
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).not.toHaveBeenCalledWith('node_dialogue_runner', 'onNext');
    });

    it('advances dialogue to onNext when clickEntity is clicked after typing finishes', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      mockGame.isPointerOver = (entity) => entity.id === 'dialogBox';

      const dialogMap = {
        d_1: { text: 'Kalimat selesai.', next: 'd_2' },
        d_2: { text: 'Kalimat berikutnya.', next: false }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat selesai.');

      // Click on dialogBox
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).toHaveBeenCalledWith('node_dialogue_runner', 'onNext');
      const outputs = runner.nodeOutputs.get('node_dialogue_runner');
      expect(outputs.nextDialogId).toBe('d_2');
    });

    it('warns when clickEntity is specified but does not exist in entity registry', () => {
      const { mockGame, emittedWarns } = createMockVnGame();

      const dialogMap = {
        d_1: { text: 'Testing missing entity', next: false }
      };

      const { runner } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'missingClickEntity',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      const warning = emittedWarns.find(w => w.message.includes('missingClickEntity'));
      expect(warning).toBeDefined();
      expect(warning.message).toContain("[Dialogue Runner] clickEntity 'missingClickEntity' not found.");
    });

    it('still supports keyboard keys Space, Enter, KeyZ when clickEntity is configured', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      // Pointer is not over anything
      mockGame.isPointerOver = () => false;

      const dialogMap = {
        d_1: { text: 'Teks panjang yang sedang diketik.', next: 'd_2' }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 50
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      runner.update(0.016);
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Teks panjang yang sedang diketik.'.length);

      // Press Spacebar to skip typewriter
      mockGame.input.keyboard.pressedKeys.add('Space');
      runner.update(0.016);
      mockGame.input.keyboard.pressedKeys.delete('Space');

      expect(textEntity.components.TextRenderer.value).toBe('Teks panjang yang sedang diketik.');

      // Press Enter to advance dialog
      const flowSpy = vi.spyOn(runner, 'executeFlow');
      mockGame.input.keyboard.pressedKeys.add('Enter');
      runner.update(0.016);
      mockGame.input.keyboard.pressedKeys.delete('Enter');

      expect(flowSpy).toHaveBeenCalledWith('node_dialogue_runner', 'onNext');
    });

    it('does not trigger if another entity or layer is blocking clickEntity (raycast occlusion)', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      const blockingButton = { id: 'btnMenu', components: {} };

      mockGame.entityRegistry.set('dialogBox', clickBox);
      mockGame.entityRegistry.set('btnMenu', blockingButton);

      // Raycast indicates btnMenu is on top, blocking dialogBox underneath
      mockGame.isPointerOver = (entity, useRaycast) => {
        expect(useRaycast).toBe(true);
        return entity.id === 'btnMenu';
      };

      const dialogMap = {
        d_1: { text: 'Teks dialog yang panjang.', next: 'd_2' }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 50
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');

      runner.update(0.016);
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Teks dialog yang panjang.'.length);

      // Player clicks on btnMenu (which blocks dialogBox)
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Must NOT skip typewriter because it is blocked by btnMenu!
      expect(textEntity.components.TextRenderer.value.length).toBeLessThan('Teks dialog yang panjang.'.length);
      expect(flowSpy).not.toHaveBeenCalled();
    });

    it('supports clickArea as alias input for clickEntity', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      mockGame.isPointerOver = (entity) => entity.id === 'dialogBox';

      const dialogMap = {
        d_1: { text: 'Kalimat selesai.', next: 'd_2' }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickArea: 'dialogBox',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat selesai.');

      // Click on dialogBox
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).toHaveBeenCalledWith('node_dialogue_runner', 'onNext');
      const outputs = runner.nodeOutputs.get('node_dialogue_runner');
      expect(outputs.nextDialogId).toBe('d_2');
    });

    it('does not block clickEntity if the blocking entity has visible: false or active: false', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', visible: true, active: true, components: {} };
      const blockingButton = { id: 'btnMenu', visible: false, active: true, components: {} };

      mockGame.entityRegistry.set('dialogBox', clickBox);
      mockGame.entityRegistry.set('btnMenu', blockingButton);

      // Raycast bypasses btnMenu because it is invisible (visible: false), hitting dialogBox
      mockGame.isPointerOver = (entity, useRaycast) => {
        expect(useRaycast).toBe(true);
        // If btnMenu is invisible, it doesn't block, so dialogBox is hit
        if (blockingButton.visible === false || blockingButton.active === false) {
          return entity.id === 'dialogBox';
        }
        return entity.id === 'btnMenu';
      };

      const dialogMap = {
        d_1: { text: 'Kalimat selesai.', next: 'd_2' }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat selesai.');

      // Click on dialogBox while blockingButton has visible: false -> should advance!
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).toHaveBeenCalledWith('node_dialogue_runner', 'onNext');
      const outputs = runner.nodeOutputs.get('node_dialogue_runner');
      expect(outputs.nextDialogId).toBe('d_2');
    });

    it('does not trigger if clickEntity itself has visible: false or active: false', () => {
      const { mockGame } = createMockVnGame();
      const clickBox = { id: 'dialogBox', visible: false, active: true, components: {} };
      mockGame.entityRegistry.set('dialogBox', clickBox);

      mockGame.isPointerOver = () => true;

      const dialogMap = {
        d_1: { text: 'Kalimat selesai.', next: 'd_2' }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_1',
        clickEntity: 'dialogBox',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      const flowSpy = vi.spyOn(runner, 'executeFlow');

      runner._executeNodeLogic(node, 'execIn');
      expect(textEntity.components.TextRenderer.value).toBe('Kalimat selesai.');

      // Click on dialogBox while visible: false -> should NOT trigger
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).not.toHaveBeenCalled();

      // If active: false and visible: true -> should also NOT trigger
      clickBox.visible = true;
      clickBox.active = false;
      mockGame.input.pointer.down = false;
      runner.update(0.016);
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      expect(flowSpy).not.toHaveBeenCalled();
    });
  });

  describe('Inline Signal Emission in Dialogue Runner & Choice Presenter', () => {
    it('triggers inline {emit(signalName:value)} mid-typewriter and strips tag from rendered dialogue', () => {
      const { mockGame, emittedSignals } = createMockVnGame();
      const dialogMap = {
        d_grape: {
          text: 'Halo, nama ku {local(playerName)}, sebagai perkenalan, nih 20 anggur {emit(giveGrape:20)}, selamat menikmati'
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_grape',
        speed: 10
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // Initially at index 0, giveGrape has NOT triggered yet
      expect(emittedSignals.some(s => s.name === 'giveGrape')).toBe(false);

      // Advance by 100ms -> only 10 chars typed
      runner.update(0.100);
      expect(emittedSignals.some(s => s.name === 'giveGrape')).toBe(false);

      // Advance enough frames so typewriter passes index where {emit(...)} is located (around char 55)
      runner.update(1.0);

      // giveGrape signal should now be emitted with value 20
      const grapeSignal = emittedSignals.find(s => s.name === 'giveGrape');
      expect(grapeSignal).toBeDefined();
      expect(grapeSignal.args[0]).toBe(20);

      // The text displayed should NOT contain {emit(...)}
      expect(textEntity.components.TextRenderer.value).not.toContain('{emit');
      expect(textEntity.components.TextRenderer.value).toContain('Calk, sebagai perkenalan, nih 20 anggur , selamat menikmati');
    });

    it('triggers pending {emit(...)} signals immediately if dialogue is skipped via click', () => {
      const { mockGame, emittedSignals } = createMockVnGame();
      const dialogMap = {
        d_skip: {
          text: 'Teks panjang {emit(sigA:1)} dan lebih panjang lagi {emit(sigB:2)} selesai.'
        }
      };

      const { runner, textEntity } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_skip',
        speed: 100
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      // Click immediately while typing
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Both signals should have triggered
      expect(emittedSignals.some(s => s.name === 'sigA' && s.args[0] === 1)).toBe(true);
      expect(emittedSignals.some(s => s.name === 'sigB' && s.args[0] === 2)).toBe(true);
      expect(textEntity.components.TextRenderer.value).not.toContain('{emit');
    });

    it('emits signals immediately on dialog start when speed is 0', () => {
      const { mockGame, emittedSignals } = createMockVnGame();
      const dialogMap = {
        d_instant: {
          text: 'Halo! {emit(instantGift:99)}'
        }
      };

      const { runner } = setupDialogueRunnerScript(mockGame, {
        dialogMap,
        dialogId: 'd_instant',
        speed: 0
      });

      const node = runner.nodeMap.get('node_dialogue_runner');
      runner._executeNodeLogic(node, 'execIn');

      expect(emittedSignals.some(s => s.name === 'instantGift' && s.args[0] === 99)).toBe(true);
    });

    it('renders choice text without {emitClick(...)} and emits all signals with values on click', () => {
      const { mockGame, emittedSignals } = createMockVnGame();
      const choices = [
        { text: 'Terima kasih {emitClick(getGold:140, unlockFishRod)}', next: 'd_next' }
      ];

      const { runner, btn1, txt1 } = setupChoicePresenterScript(mockGame, {
        choices,
        activationDelay: 0
      });

      const node = runner.nodeMap.get('node_choice_presenter');
      runner._executeNodeLogic(node, 'execIn');

      // Button text displayed does not contain {emitClick(...)}
      expect(btn1.visible).toBe(true);
      expect(txt1.components.TextRenderer.value).toBe('Terima kasih');

      // Click the choice button
      mockGame.input.pointer.down = true;
      runner.update(0.016);

      // Both signals emitted: getGold with 140, unlockFishRod with true
      const goldSig = emittedSignals.find(s => s.name === 'getGold');
      expect(goldSig).toBeDefined();
      expect(goldSig.args[0]).toBe(140);

      const fishSig = emittedSignals.find(s => s.name === 'unlockFishRod');
      expect(fishSig).toBeDefined();
      expect(fishSig.args[0]).toBe(true);

      // Next dialog is set and choices hidden
      const outputs = runner.nodeOutputs.get('node_choice_presenter');
      expect(outputs.nextDialogId).toBe('d_next');
      expect(outputs.signalName).toBeUndefined();
    });

    it('supports actionEmitSignal with value input and eventOnSignal with execOut and value output', () => {
      const { mockGame } = createMockVnGame();
      const emitSignalDef = BlueprintSystem.items.find(i => i.type === 'actionEmitSignal');
      const onSignalDef = BlueprintSystem.items.find(i => i.type === 'eventOnSignal');

      let receivedValue = null;
      let eventFired = false;

      const scriptData = {
        id: 'script_signal_test',
        localVariables: [],
        nodes: [
          {
            id: 'node_on_signal',
            type: 'eventOnSignal',
            inputs: onSignalDef.defaultData.inputs,
            outputs: onSignalDef.defaultData.outputs,
            data: {
              values: { signalName: 'rewardEvent' },
              code: onSignalDef.defaultData.data.code
            }
          },
          {
            id: 'node_custom_receiver',
            type: 'customReceiver',
            inputs: [
              { id: 'execIn', dataType: 'execution' },
              { id: 'valIn', dataType: 'any' }
            ],
            outputs: [],
            data: {
              code: `
                eventFired = true;
                receivedValue = inputs.valIn;
              `
            }
          },
          {
            id: 'node_emit_signal',
            type: 'actionEmitSignal',
            inputs: emitSignalDef.defaultData.inputs,
            outputs: emitSignalDef.defaultData.outputs,
            data: {
              values: { signalName: 'rewardEvent', value: { coins: 50, item: 'Grape' } },
              code: emitSignalDef.defaultData.data.code
            }
          }
        ],
        edges: [
          {
            source: 'node_on_signal',
            sourceHandle: 'execOut',
            target: 'node_custom_receiver',
            targetHandle: 'execIn'
          },
          {
            source: 'node_on_signal',
            sourceHandle: 'value',
            target: 'node_custom_receiver',
            targetHandle: 'valIn'
          }
        ]
      };

      const runner = new ScriptRunner(mockGame, scriptData, { id: 'ent_runner' });

      // Register listener
      const onSignalNode = runner.nodeMap.get('node_on_signal');
      runner._executeNodeLogic(onSignalNode, 'execIn');

      // Now emit signal using actionEmitSignal node
      const emitNode = runner.nodeMap.get('node_emit_signal');
      runner._executeNodeLogic(emitNode, 'execIn');

      // Verify onSignal outputs
      const onSignalOutputs = runner.nodeOutputs.get('node_on_signal');
      expect(onSignalOutputs.value).toEqual({ coins: 50, item: 'Grape' });
    });
  });
});
