import { describe, it, expect } from 'vitest';
import { ALL_BLUEPRINTS } from '@nodes/library/blueprints/index.js';
import {
  CODE_PANEL_PARAM_NAMES,
  VALID_CONTEXT_PROPERTIES,
  stripComments,
  stripStringsAndComments,
  extractUsedInputs,
  extractUsedOutputs,
  extractUsedLocalVariables,
  extractUsedGlobalVariables,
  extractContextAccesses,
  validateCodePanelContract,
  generateDefaultNodeCode
} from '@nodes/contract/codePanelContract.js';

describe('CodePanel Contract & Blueprint Evaluation', () => {
  describe('Canonical Signatures & Constants', () => {
    it('defines the standard 4 parameter names for custom node script functions', () => {
      expect(CODE_PANEL_PARAM_NAMES).toEqual(['inputs', 'outputs', 'context', 'node']);
      expect(Object.isFrozen(CODE_PANEL_PARAM_NAMES)).toBe(true);
    });

    it('contains all 15 official context namespaces', () => {
      const namespaces = [
        'entity', 'layer', 'prefab', 'collider', 'input',
        'ui', 'signal', 'lifecycle', 'transition', 'camera',
        'scene', 'state', 'console', 'assert', 'audio'
      ];
      namespaces.forEach(ns => {
        expect(VALID_CONTEXT_PROPERTIES.has(ns)).toBe(true);
      });
    });

    it('contains root context methods and properties', () => {
      expect(VALID_CONTEXT_PROPERTIES.has('onTick')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('triggerFlow')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('onGameQuit')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('onQuit')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('getLocal')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('setLocal')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('getGlobal')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('setGlobal')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('notify')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('owner')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('dt')).toBe(true);
      expect(VALID_CONTEXT_PROPERTIES.has('deltaTime')).toBe(true);
    });
  });

  describe('Comment Stripping (stripComments & stripStringsAndComments)', () => {
    it('strips single-line and multi-line comments from code', () => {
      const code = `
        // This is a single line comment
        /* This is a 
           multi-line comment */
        const x = 42;
      `;
      const clean = stripComments(code);
      expect(clean).not.toContain('single line comment');
      expect(clean).not.toContain('multi-line comment');
      expect(clean).toContain('const x = 42;');
    });

    it('preserves string literals with slashes like URLs', () => {
      const code = `const url = "https://lupis.dev/api"; // comment here`;
      const clean = stripComments(code);
      expect(clean).toContain('https://lupis.dev/api');
      expect(clean).not.toContain('comment here');
    });

    it('stripStringsAndComments functions as alias to stripComments', () => {
      const code = `// comment\nconst a = 1;`;
      expect(stripStringsAndComments(code)).toBe(stripComments(code));
    });
  });

  describe('Port & Variable Identifier Extraction', () => {
    it('extracts input ports from dot and bracket notations', () => {
      const code = `
        const val1 = inputs.speed;
        const val2 = inputs['angle'];
        const val3 = inputs["multiplier"];
        // inputs.commentedOut = 99;
      `;
      const inputs = extractUsedInputs(code);
      expect(inputs).toEqual(expect.arrayContaining(['speed', 'angle', 'multiplier']));
      expect(inputs).not.toContain('commentedOut');
    });

    it('extracts output ports from dot assignment, compound assignment, and bracket notations', () => {
      const code = `
        outputs.result = 42;
        outputs['velocity'] = 100;
        outputs["isGrounded"] = true;
        outputs.execOut = true;
        outputs.counter += 1;
        context.triggerFlow('onComplete');
        context.triggerFlow("onCustomEvent");
        // outputs.ignored = 0;
      `;
      const outputs = extractUsedOutputs(code);
      expect(outputs).toEqual(expect.arrayContaining(['result', 'velocity', 'isGrounded', 'execOut', 'counter', 'onComplete', 'onCustomEvent']));
      expect(outputs).not.toContain('ignored');
    });

    it('extracts local variable access from context.getLocal and setLocal', () => {
      const code = `
        const health = context.getLocal('playerHealth');
        context.setLocal('shieldPoints', 50);
        // context.getLocal('fakeLocal');
      `;
      const locals = extractUsedLocalVariables(code);
      expect(locals).toEqual(expect.arrayContaining(['playerHealth', 'shieldPoints']));
      expect(locals).not.toContain('fakeLocal');
    });

    it('extracts global variable access from context.getGlobal and setGlobal', () => {
      const code = `
        const score = context.getGlobal('HighScore');
        context.setGlobal('CurrentLevel', 3);
        // context.getGlobal('fakeGlobal');
      `;
      const globals = extractUsedGlobalVariables(code);
      expect(globals).toEqual(expect.arrayContaining(['HighScore', 'CurrentLevel']));
      expect(globals).not.toContain('fakeGlobal');
    });

    it('extracts context property accesses', () => {
      const code = `
        context.entity.getComponent('Transform');
        context.camera.setZoom(1.5);
        context.unknownSystem.doSomething();
      `;
      const accesses = extractContextAccesses(code);
      expect(accesses).toEqual(expect.arrayContaining(['entity', 'camera', 'unknownSystem']));
    });
  });

  describe('Full Contract Validation (validateCodePanelContract)', () => {
    const mockNode = {
      id: 'node_test_1',
      inputs: [
        { id: 'execIn', dataType: 'execution' },
        { id: 'a', label: 'Operand A', dataType: 'number' },
        { id: 'b', label: 'Operand B', dataType: 'number' }
      ],
      outputs: [
        { id: 'execOut', dataType: 'execution' },
        { id: 'result', label: 'Result', dataType: 'number' }
      ]
    };

    const mockLocalVars = [
      { id: 'var_speed', name: 'playerSpeed' }
    ];

    const mockGlobalVars = [
      { id: 'g_diff', name: 'Difficulty' }
    ];

    it('validates a fully compliant code snippet with ports and variables matched', () => {
      const code = `
        const valA = inputs['Operand A'];
        const valB = inputs['Operand B'];
        const speed = context.getLocal('playerSpeed');
        const diff = context.getGlobal('Difficulty');
        outputs['Result'] = (valA + valB) * speed * diff;
        outputs.execOut = true;
      `;

      const result = validateCodePanelContract(code, {
        node: mockNode,
        localVariables: mockLocalVars,
        globalVariables: mockGlobalVars
      });

      expect(result.isValid).toBe(true);
      expect(result.hasSyntaxError).toBe(false);
      expect(result.syntaxError).toBeNull();
      expect(result.issues).toHaveLength(0);
      expect(result.usedInputsCount).toBe(2);
      expect(result.usedOutputsCount).toBe(2);
      expect(result.usedVarsCount).toBe(2);
    });

    it('reports missing port and variable errors according to standard engine contract', () => {
      const code = `
        const missingIn = inputs['UnknownPort'];
        outputs['UnknownOut'] = 123;
        context.getLocal('MissingLocal');
        context.getGlobal('MissingGlobal');
      `;

      const result = validateCodePanelContract(code, {
        node: mockNode,
        localVariables: mockLocalVars,
        globalVariables: mockGlobalVars
      });

      expect(result.isValid).toBe(false);
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining("Input 'UnknownPort' is used in code, but is not defined in Node Input Ports."),
        expect.stringContaining("Output 'UnknownOut' is set in code, but is not defined in Node Output Ports."),
        expect.stringContaining("Input Port 'Operand A' is defined on node, but never read in code."),
        expect.stringContaining("Input Port 'Operand B' is defined on node, but never read in code."),
        expect.stringContaining("Output Port 'Result' is defined on node, but never set in code."),
        expect.stringContaining("Output Port 'execOut' is defined on node, but never set in code."),
        expect.stringContaining("Local Variable 'MissingLocal' is referenced in code, but not defined in Script Variables."),
        expect.stringContaining("Global Variable 'MissingGlobal' is referenced in code, but not defined in Project Global Variables.")
      ]));
    });

    it('flags unrecognized context property accesses', () => {
      const code = `
        const valA = inputs['Operand A'];
        const valB = inputs['Operand B'];
        outputs['Result'] = valA + valB;
        outputs.execOut = true;
        context.nonExistentApi.invoke();
      `;

      const result = validateCodePanelContract(code, {
        node: mockNode,
        localVariables: mockLocalVars,
        globalVariables: mockGlobalVars
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes("Context property 'context.nonExistentApi' is not defined in ContextSystem contract"))).toBe(true);
      expect(result.metadata.unrecognizedContextProps).toContain('nonExistentApi');
    });

    it('reports JavaScript syntax errors in code', () => {
      const code = 'const x = ; outputs.result = 10;';

      const result = validateCodePanelContract(code, {
        node: mockNode,
        localVariables: mockLocalVars,
        globalVariables: mockGlobalVars
      });

      expect(result.isValid).toBe(false);
      expect(result.hasSyntaxError).toBe(true);
      expect(result.syntaxError).toBeTruthy();
      expect(result.issues.some(i => i.toLowerCase().includes('syntax error'))).toBe(true);
    });

    it('gracefully handles empty code and null node', () => {
      const emptyResult = validateCodePanelContract('', { node: mockNode });
      expect(emptyResult.isValid).toBe(false); // Unused ports
      expect(emptyResult.hasSyntaxError).toBe(false);

      const nullNodeResult = validateCodePanelContract('const x = 1;', { node: null });
      expect(nullNodeResult.isValid).toBe(true);
      expect(nullNodeResult.issues).toHaveLength(0);
    });
  });

  describe('Boilerplate Generation (generateDefaultNodeCode)', () => {
    it('generates standard template reading data inputs and setting outputs', () => {
      const node = {
        id: 'node_add',
        inputs: [
          { id: 'execIn', dataType: 'execution' },
          { id: 'inA', label: 'Operand A', dataType: 'number' },
          { id: 'inB', label: 'Operand B', dataType: 'number' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution' },
          { id: 'outResult', label: 'Sum', dataType: 'number' }
        ]
      };

      const code = generateDefaultNodeCode(node);

      expect(code).toContain("const inA = inputs['Operand A'];");
      expect(code).toContain("const inB = inputs['Operand B'];");
      expect(code).toContain("// 2. Execute node computation");
      expect(code).toContain("outputs['Sum'] = null;");
      expect(code).toContain("outputs.execOut = true;");
    });

    it('handles pure calculation node without execution outputs', () => {
      const pureNode = {
        id: 'node_pure',
        inputs: [
          { id: 'x', label: 'Value X', dataType: 'number' }
        ],
        outputs: [
          { id: 'y', label: 'Value Y', dataType: 'number' }
        ]
      };

      const code = generateDefaultNodeCode(pureNode);

      expect(code).toContain("const x = inputs['Value X'];");
      expect(code).toContain("outputs['Value Y'] = null;");
      expect(code).not.toContain("outputs.execOut");
    });

    it('flags warnings when inputs or outputs are forwarded generically without explicit port references in code (no bypass allowed)', () => {
      const helperNode = {
        id: 'node_toolkit',
        inputs: [
          { id: 'targetEntity', label: 'targetEntity', dataType: 'string' },
          { id: 'speed', label: 'speed', dataType: 'number' }
        ],
        outputs: [
          { id: 'execOut', label: 'execOut', dataType: 'execution' },
          { id: 'velocityX', label: 'velocityX', dataType: 'number' }
        ]
      };

      const unexposedCode = `
        const helper = context.toolkit.platformer;
        if (helper) {
          helper.processController(context.state, inputs, outputs, context);
        }
        return;
      `;

      const unexposedResult = validateCodePanelContract(unexposedCode, { node: helperNode });
      expect(unexposedResult.isValid).toBe(false);
      expect(unexposedResult.issues).toContain("Input Port 'targetEntity' is defined on node, but never read in code.");
      expect(unexposedResult.issues).toContain("Input Port 'speed' is defined on node, but never read in code.");
      expect(unexposedResult.issues).toContain("Output Port 'execOut' is defined on node, but never set in code.");
      expect(unexposedResult.issues).toContain("Output Port 'velocityX' is defined on node, but never set in code.");

      const explicitCode = `
        const targetEntity = inputs.targetEntity;
        const speed = inputs.speed;
        const helper = context.toolkit.platformer;
        if (helper) {
          const res = helper.processController({ targetEntity, speed }, context);
          outputs.velocityX = res.velocityX;
        }
        outputs.execOut = true;
        return;
      `;

      const explicitResult = validateCodePanelContract(explicitCode, { node: helperNode });
      expect(explicitResult.hasSyntaxError).toBe(false);
      expect(explicitResult.issues).toEqual([]);
      expect(explicitResult.isValid).toBe(true);
    });

    it('returns default fallback when node is null', () => {
      expect(generateDefaultNodeCode(null)).toContain('Write your node logic here');
    });

    it('validates that all blueprint items across all 11 categories pass with 0 contract issues', () => {
      let totalNodes = 0;
      const issues = [];

      ALL_BLUEPRINTS.forEach(bp => {
        bp.items.forEach(item => {
          totalNodes++;
          const res = validateCodePanelContract(item.defaultData.data?.code, { node: item.defaultData, blueprint: bp });
          if (res.issues.length > 0) {
            issues.push({ blueprint: bp.id, type: item.type, issues: res.issues });
          }
        });
      });

      expect(totalNodes).toBeGreaterThan(140);
      expect(issues).toEqual([]);
    });
  });
});
