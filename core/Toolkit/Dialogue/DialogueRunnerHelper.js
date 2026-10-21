export function processDialogueRunner(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  let dialogMap = inputs.dialogMap || inputs.dialogueMap;

  if (!dialogMap) {
    if (typeof context.hasVariable === 'function') {
      if (context.hasVariable('dialogueMap')) {
        dialogMap = context.getVariable('dialogueMap');
      } else if (context.hasVariable('dialogMap')) {
        dialogMap = context.getVariable('dialogMap');
      }
    }
  }

  let charMap = inputs.charMap || inputs.characterMap;
  if (!charMap) {
    if (typeof context.hasVariable === 'function') {
      if (context.hasVariable('characterMap')) {
        charMap = context.getVariable('characterMap');
      } else if (context.hasVariable('charMap')) {
        charMap = context.getVariable('charMap');
      }
    }
  }

  dialogMap = context.assert.exists(dialogMap, 'Dialog Map must be provided');

  let dialogId = inputs.dialogId;
  if (state.vnNextDialogId && (dialogId === state.vnLastDialogId || !dialogId)) {
    dialogId = state.vnNextDialogId;
  }
  if (!dialogId && dialogMap) {
    const keys = Object.keys(dialogMap);
    if (keys.length > 0) {
      dialogId = keys[0];
    }
  }
  state.vnLastDialogId = dialogId;

  const entry = dialogMap ? dialogMap[dialogId] : false;

  const makeResult = () => ({
    onNext: Boolean(outputs.onNext),
    onChoice: Boolean(outputs.onChoice),
    onEnd: Boolean(outputs.onEnd),
    nextDialogId: outputs.nextDialogId || '',
    choices: outputs.choices || []
  });

  if (!entry) {
    if (context.console && typeof context.console.warn === 'function') {
      context.console.warn("[Dialogue Runner] Dialog ID '" + (dialogId || '') + "' not found in Dialog Map.");
    }
    outputs.onEnd = true;
    context.triggerFlow('onEnd');
    return makeResult();
  }

  const now = Date.now();
  if (!state.vnLoopGuard) {
    state.vnLoopGuard = { lastTime: now, count: 0 };
  }
  const guard = state.vnLoopGuard;
  if (now - guard.lastTime < 150) {
    guard.count++;
    if (guard.count > 25) {
      if (context.console && typeof context.console.error === 'function') {
        context.console.error("[Dialogue Runner] Auto loop detected on dialog '" + dialogId + "' (" + guard.count + " iterations in <150ms). Execution aborted to prevent game freeze.");
      }
      outputs.onEnd = true;
      context.triggerFlow('onEnd');
      return makeResult();
    }
  } else {
    guard.lastTime = now;
    guard.count = 1;
  }

  const parseVars = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\{([^{}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      if (!trimmed || /^emit(?:Click)?\s*\(/i.test(trimmed)) return match;

      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      let scope = false;
      let varName = false;

      if (scopeMatch) {
        scope = scopeMatch[1].toLowerCase();
        varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      } else {
        varName = trimmed;
      }

      if (!varName) return match;

      const resolveVar = (sc, name) => {
        try {
          if (sc === 'local' && typeof context.getLocal === 'function') {
            return { found: true, val: context.getLocal(name) };
          }
          if (sc === 'global' && typeof context.getGlobal === 'function') {
            return { found: true, val: context.getGlobal(name) };
          }
        } catch (e) {
          return { found: false };
        }
        return { found: false };
      };

      let result = false;
      let hasResult = false;

      if (scope === 'local') {
        const res = resolveVar('local', varName);
        if (res.found) {
          result = res.val;
          hasResult = true;
        }
      } else if (scope === 'global') {
        const res = resolveVar('global', varName);
        if (res.found) {
          result = res.val;
          hasResult = true;
        }
      } else {
        if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
          try {
            result = context.getVariable(varName);
            hasResult = true;
          } catch (e) {}
        }
        if (!hasResult) {
          const resLocal = resolveVar('local', varName);
          if (resLocal.found) {
            result = resLocal.val;
            hasResult = true;
          }
        }
        if (!hasResult) {
          const resGlobal = resolveVar('global', varName);
          if (resGlobal.found) {
            result = resGlobal.val;
            hasResult = true;
          }
        }
      }

      if (hasResult) {
        return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
      }
      return match;
    });
  };

  const splitArgs = (str) => {
    const args = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inQuote) {
        cur += c;
        if (c === quoteChar && str[i - 1] !== '\\') {
          inQuote = false;
        }
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        cur += c;
      } else if (c === '(' || c === '[' || c === '{') {
        depth++;
        cur += c;
      } else if (c === ')' || c === ']' || c === '}') {
        depth--;
        cur += c;
      } else if (c === ',' && depth === 0) {
        if (cur.trim()) args.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  const parseSignalArg = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return false;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      return { signal: trimmed, value: true };
    }
    const signal = trimmed.slice(0, colonIdx).trim();
    const valRaw = trimmed.slice(colonIdx + 1).trim();
    if (valRaw === '') {
      return { signal, value: true };
    }
    try {
      return { signal, value: JSON.parse(valRaw) };
    } catch (e) {
      return { signal, value: valRaw };
    }
  };

  const rawEntryText = parseVars(entry.text || '');

  let fullText = '';
  const emitCues = [];
  let lastIdx = 0;
  const emitRegex = /\{emit\s*\(([^)]*)\)\}/gi;
  let m;
  while ((m = emitRegex.exec(rawEntryText))) {
    fullText += rawEntryText.slice(lastIdx, m.index);
    const charIdx = fullText.length;
    const sigs = splitArgs(m[1]).map(parseSignalArg).filter(Boolean);
    if (sigs.length > 0) {
      emitCues.push({ index: charIdx, signals: sigs, triggered: false });
    }
    lastIdx = emitRegex.lastIndex;
  }
  fullText += rawEntryText.slice(lastIdx);

  const triggerPendingEmits = (currentIdx) => {
    const cues = state.vnEmitCues;
    if (!cues || !context.signal || typeof context.signal.emit !== 'function') return;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (!cue.triggered && currentIdx >= cue.index) {
        cue.triggered = true;
        for (let s = 0; s < cue.signals.length; s++) {
          context.signal.emit(cue.signals[s].signal, cue.signals[s].value);
        }
      }
    }
  };

  const textEntId = inputs.textEntity || 'dialogText';
  const textEnt = context.assert.exists(context.entity.get(textEntId), 'Dialogue Text entity must exist');
  let textComp = textEnt.components ? textEnt.components.TextRenderer : false;
  if (!textComp) {
    const children = context.entity.getChildren(textEnt);
    for (let c = 0; c < children.length; c++) {
      if (children[c].components && children[c].components.TextRenderer) {
        textComp = children[c].components.TextRenderer;
        break;
      }
    }
  }
  context.assert.exists(textComp, 'Dialogue entity or its children must have TextRenderer component');

  const spkEntId = inputs.speakerEntity || 'characterName';
  const nameEntId = inputs.nameEntity || 'nameBox';
  const spkEnt = spkEntId ? context.entity.get(spkEntId) : false;
  const nameEnt = nameEntId ? context.entity.get(nameEntId) : false;

  const clickEntId = inputs.clickEntity || inputs.clickArea;
  const clickEnt = (clickEntId && typeof clickEntId === 'object') ? clickEntId : (clickEntId ? context.entity.get(clickEntId) : false);
  if (clickEntId && !clickEnt) {
    if (context.console && typeof context.console.warn === 'function') {
      context.console.warn("[Dialogue Runner] clickEntity '" + clickEntId + "' not found.");
    }
  }

  const charData = charMap ? charMap[entry.speaker] : false;
  const rawSpeaker = charData && charData.displayName ? charData.displayName : (entry.speaker ? entry.speaker : '');
  const isNarrator = !entry.speaker || entry.speaker === 'narrator' || (charData && charData.displayName === '');

  if (isNarrator) {
    if (nameEnt) nameEnt.visible = false;
    if (spkEnt) spkEnt.visible = false;
  } else {
    if (nameEnt) nameEnt.visible = true;
    if (spkEnt) {
      spkEnt.visible = true;
      let spkComp = spkEnt.components ? spkEnt.components.TextRenderer : false;
      if (!spkComp) {
        const children = context.entity.getChildren(spkEnt);
        for (let c = 0; c < children.length; c++) {
          if (children[c].components && children[c].components.TextRenderer) {
            spkComp = children[c].components.TextRenderer;
            break;
          }
        }
      }
      if (spkComp) {
        spkComp.value = parseVars(rawSpeaker);
        if (charData && charData.nameColor) {
          spkComp.color = charData.nameColor;
        }
      }
    }
  }

  const portEntId = inputs.portraitEntity || 'spriteCharacter';
  let targetEnt = portEntId ? context.entity.get(portEntId) : false;
  if (targetEnt) {
    let portEnt = targetEnt;
    let imgComp = portEnt.components ? portEnt.components.SpriteRenderer : false;
    let animComp = portEnt.components ? portEnt.components.SpriteAnimator : false;

    if (!imgComp && !animComp) {
      const children = context.entity.getChildren(targetEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && (children[c].components.SpriteRenderer || children[c].components.SpriteAnimator)) {
          portEnt = children[c];
          imgComp = portEnt.components.SpriteRenderer || false;
          animComp = portEnt.components.SpriteAnimator || false;
          break;
        }
      }
    }

    if (isNarrator) {
      portEnt.visible = false;
      if (targetEnt !== portEnt) targetEnt.visible = false;
    } else {
      let spriteVal = false;
      if (charData && charData.sprites) {
        const emo = entry.emotion;
        if (emo && charData.sprites[emo]) {
          spriteVal = charData.sprites[emo];
        } else {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        }
      }

      if (spriteVal) {
        let finalAssetId = spriteVal;
        if (context.asset && typeof context.asset.resolveId === 'function') {
          const resolved = context.asset.resolveId(spriteVal);
          if (resolved) {
            finalAssetId = resolved;
          }
        }
        if (imgComp) {
          imgComp.assetId = finalAssetId;
        }
        if (animComp && animComp.clips && Array.isArray(animComp.clips)) {
          const matchedClip = animComp.clips.find(c => 
            c.scriptId === spriteVal || 
            c.scriptId === entry.emotion || 
            c.id === spriteVal || 
            c.id === entry.emotion ||
            c.assetId === finalAssetId ||
            c.id === finalAssetId
          );
          if (matchedClip) {
            animComp.currentClip = matchedClip.id;
          }
        }
        portEnt.visible = true;
        if (targetEnt !== portEnt) targetEnt.visible = true;
      } else {
        portEnt.visible = false;
        if (targetEnt !== portEnt) targetEnt.visible = false;
      }
    }
  }

  const rawSpeed = Number(inputs.speed);
  const speed = isNaN(rawSpeed) ? 40 : Math.max(0, rawSpeed);

  state.vnTargetText = fullText;
  state.vnEmitCues = emitCues;
  state.vnTimer = 0;
  state.vnCompleted = false;

  const currentPointer = context.input ? context.input.getPointer() : false;
  state.vnWasDown = Boolean(currentPointer && currentPointer.down);

  if (speed === 0 || fullText.length === 0) {
    state.vnIndex = fullText.length;
    state.vnIsTyping = false;
    textComp.value = fullText;
    triggerPendingEmits(fullText.length);
    if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
      state.vnCompleted = true;
      outputs.choices = entry.choices;
      outputs.onChoice = true;
      context.triggerFlow('onChoice');
    }
  } else {
    state.vnIndex = 0;
    state.vnIsTyping = true;
    textComp.value = '';
    triggerPendingEmits(0);
  }

  context.onTick((tickDt) => {
    if (state.vnCompleted) return;

    const dtSec = (typeof tickDt === 'number' && tickDt > 0) ? tickDt : (context.dt || 0.016);
    const dt = dtSec * 1000;

    const pointer = context.input ? context.input.getPointer() : false;
    const isPointerDown = Boolean(pointer && pointer.down);
    const isNewPointerDown = isPointerDown && !state.vnWasDown;
    state.vnWasDown = isPointerDown;

    const kbd = context.input && context.input.keyboard;
    const isKeyAdvance = Boolean(
      kbd && (
        kbd.isPressed('Space') ||
        kbd.isPressed('Enter') ||
        kbd.isPressed('KeyZ')
      )
    );

    let isPointerClick = false;
    if (isNewPointerDown) {
      if (clickEnt) {
        if (clickEnt.active !== false && clickEnt.visible !== false) {
          if (context.input && typeof context.input.isPointerOver === 'function') {
            isPointerClick = Boolean(context.input.isPointerOver(clickEnt, true));
          }
        }
      } else if (!clickEntId) {
        isPointerClick = true;
      }
    }

    const isClick = isPointerClick || isKeyAdvance;

    if (state.vnIsTyping) {
      if (isClick) {
        state.vnIndex = state.vnTargetText.length;
        textComp.value = state.vnTargetText;
        state.vnIsTyping = false;
        triggerPendingEmits(state.vnTargetText.length);
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          state.vnCompleted = true;
          outputs.choices = entry.choices;
          outputs.onChoice = true;
          context.triggerFlow('onChoice');
        }
        return;
      }

      const charSpeed = Math.max(1, speed);
      state.vnTimer += dt;
      while (state.vnTimer >= charSpeed && state.vnIndex < state.vnTargetText.length) {
        state.vnTimer -= charSpeed;
        state.vnIndex++;
        triggerPendingEmits(state.vnIndex);
      }
      textComp.value = state.vnTargetText.slice(0, state.vnIndex);

      if (state.vnIndex >= state.vnTargetText.length) {
        state.vnIsTyping = false;
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          state.vnCompleted = true;
          outputs.choices = entry.choices;
          outputs.onChoice = true;
          context.triggerFlow('onChoice');
        }
      }
    } else {
      if (isClick) {
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          return;
        }
        state.vnCompleted = true;
        if (entry.next) {
          state.vnNextDialogId = entry.next;
          outputs.nextDialogId = entry.next;
          outputs.onNext = true;
          context.triggerFlow('onNext');
        } else {
          state.vnNextDialogId = false;
          outputs.onEnd = true;
          context.triggerFlow('onEnd');
        }
      }
    }
  });
  const result = {
    onNext: Boolean(outputs.onNext),
    onChoice: Boolean(outputs.onChoice),
    onEnd: Boolean(outputs.onEnd),
    nextDialogId: outputs.nextDialogId || '',
    choices: outputs.choices || []
  };
  Object.assign(outputs, result);
  return result;
}

export function processChoicePresenter(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const choices = inputs.choices;
  const buttons = inputs.buttonEntities || ['btnChoice1', 'btnChoice2', 'btnChoice3'];
  const textEntities = inputs.textEntities || ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'];

  context.assert.isArray(choices, 'Choices must be a valid array');
  context.assert.isArray(buttons, 'Button entities must be a valid array');

  const parseVars = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\{([^{}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      if (!trimmed || /^emit(?:Click)?\s*\(/i.test(trimmed)) return match;
      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      let scope = false;
      let varName = false;
      if (scopeMatch) {
        scope = scopeMatch[1].toLowerCase();
        varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      } else {
        varName = trimmed;
      }
      if (!varName) return match;

      const resolveVar = (sc, name) => {
        try {
          if (sc === 'local' && typeof context.getLocal === 'function') {
            return { found: true, val: context.getLocal(name) };
          }
          if (sc === 'global' && typeof context.getGlobal === 'function') {
            return { found: true, val: context.getGlobal(name) };
          }
        } catch (e) {
          return { found: false };
        }
        return { found: false };
      };

      let result = false;
      let hasResult = false;
      if (scope === 'local') {
        const res = resolveVar('local', varName);
        if (res.found) { result = res.val; hasResult = true; }
      } else if (scope === 'global') {
        const res = resolveVar('global', varName);
        if (res.found) { result = res.val; hasResult = true; }
      } else {
        if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
          try { result = context.getVariable(varName); hasResult = true; } catch (e) {}
        }
        if (!hasResult) {
          const resLocal = resolveVar('local', varName);
          if (resLocal.found) { result = resLocal.val; hasResult = true; }
        }
        if (!hasResult) {
          const resGlobal = resolveVar('global', varName);
          if (resGlobal.found) { result = resGlobal.val; hasResult = true; }
        }
      }
      return hasResult ? (typeof result === 'object' && result ? JSON.stringify(result) : String(result)) : match;
    });
  };

  const splitArgs = (str) => {
    const args = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inQuote) {
        cur += c;
        if (c === quoteChar && str[i - 1] !== '\\') inQuote = false;
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        cur += c;
      } else if (c === '(' || c === '[' || c === '{') {
        depth++; cur += c;
      } else if (c === ')' || c === ']' || c === '}') {
        depth--; cur += c;
      } else if (c === ',' && depth === 0) {
        if (cur.trim()) args.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  const parseSignalArg = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return false;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) return { signal: trimmed, value: true };
    const signal = trimmed.slice(0, colonIdx).trim();
    const valRaw = trimmed.slice(colonIdx + 1).trim();
    if (valRaw === '') return { signal, value: true };
    try {
      return { signal, value: JSON.parse(valRaw) };
    } catch (e) {
      return { signal, value: valRaw };
    }
  };

  for (let i = 0; i < buttons.length; i++) {
    const btnEnt = context.entity.get(buttons[i]);
    const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
    if (!btnEnt) continue;

    if (i < choices.length) {
      btnEnt.visible = true;
      if (txtEnt) txtEnt.visible = true;

      let textComp = txtEnt && txtEnt.components ? txtEnt.components.TextRenderer : false;
      if (!textComp) {
        textComp = btnEnt.components ? btnEnt.components.TextRenderer : false;
        if (!textComp) {
          const children = context.entity.getChildren(btnEnt);
          for (let c = 0; c < children.length; c++) {
            if (children[c].components && children[c].components.TextRenderer) {
              textComp = children[c].components.TextRenderer;
              break;
            }
          }
        }
      }
      if (textComp) {
        const rawText = choices[i].text || '';
        const textWithoutEmit = rawText.replace(/\{emitClick\s*\([^)]*\)\}/gi, '').trim();
        textComp.value = parseVars(textWithoutEmit);
      }
    } else {
      btnEnt.visible = false;
      if (txtEnt) txtEnt.visible = false;
    }
  }

  state.choiceShowTime = Date.now();
  const initPointer = context.input ? context.input.getPointer() : false;
  state.choiceWasDown = Boolean(initPointer && initPointer.down);

  context.onTick(() => {
    const pointer = context.input ? context.input.getPointer() : false;
    const isPointerDown = pointer && pointer.down;

    const rawDelay = Number(inputs.activationDelay);
    const delay = isNaN(rawDelay) ? 250 : Math.max(0, rawDelay);
    const now = Date.now();

    if (now - state.choiceShowTime < delay) {
      state.choiceWasDown = Boolean(isPointerDown);
      return;
    }

    const isClick = isPointerDown && !state.choiceWasDown;
    state.choiceWasDown = isPointerDown;

    if (!isClick) return;

    for (let i = 0; i < choices.length; i++) {
      if (i >= buttons.length) break;
      const btnEnt = context.entity.get(buttons[i]);
      if (!btnEnt || !btnEnt.visible) continue;
      const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
      let isHovering = false;
      if (context.input && typeof context.input.isPointerOver === 'function') {
        isHovering = context.input.isPointerOver(btnEnt, true);
        if (!isHovering && txtEnt) {
          isHovering = context.input.isPointerOver(txtEnt, true);
        }
        if (!isHovering) {
          isHovering = context.input.isPointerOver(btnEnt, false);
        }
        if (!isHovering && txtEnt) {
          isHovering = context.input.isPointerOver(txtEnt, false);
        }
      }
      if (isHovering) {
        const selected = choices[i];

        for (let j = 0; j < buttons.length; j++) {
          const b = context.entity.get(buttons[j]);
          if (b) b.visible = false;
          if (textEntities && textEntities[j]) {
            const t = context.entity.get(textEntities[j]);
            if (t) t.visible = false;
          }
        }

        state.vnNextDialogId = selected.next;
        outputs.nextDialogId = selected.next;

        const rawText = selected.text || '';
        const emitMatches = [...rawText.matchAll(/\{emitClick\s*\(([^)]*)\)\}/gi)];
        for (let m = 0; m < emitMatches.length; m++) {
          const sigs = splitArgs(emitMatches[m][1]).map(parseSignalArg).filter(Boolean);
          for (let s = 0; s < sigs.length; s++) {
            context.signal.emit(sigs[s].signal, sigs[s].value);
          }
        }

        if (selected.signals && Array.isArray(selected.signals) && selected.signals.length > 0) {
          for (let s = 0; s < selected.signals.length; s++) {
            const sig = selected.signals[s];
            context.signal.emit(sig, true);
          }
        }

        outputs.execOut = true;
        context.triggerFlow('execOut');
        return;
      }
    }
  });
  const result = {
    execOut: Boolean(outputs.execOut),
    nextDialogId: outputs.nextDialogId || ''
  };
  Object.assign(outputs, result);
  return result;
}
