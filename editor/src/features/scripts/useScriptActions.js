// Visual script creation, deletion, renaming, cloning, and entity attachment.

import { useScriptStore } from '@scripts/scripts.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';
import { useFolderStore } from '@folders/folders.js';
import { scriptSchema } from '@scripts/scripts.js';
import { GenerateUUID, sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate } from '@utils/utils.js';

import { 
  useConfirm,
  usePopAlert,
  usePrompt
} from '@composables/composables.js';

const generateInstanceId = () => `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function useScriptActions() {
  const scriptStore = useScriptStore();
  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();
  const folderStore = useFolderStore();

  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();

  const getValidUniqueName = (desiredName, excludeId = null) => {
    return getValidUniqueScriptId(desiredName, scriptStore.scripts, s => s.scriptId, excludeId);
  };

  // Prompts for a script name and saves a new blueprint definition
  const createScript = async (type = 'component', folderId = null) => {
    const projectId = projectStore.activeProject?.id || projectStore.project?.id || null;
    const targetFolderId = folderId !== null ? folderId : (folderStore.activeFolderId || null);

    const defaultName = type === 'component' ? 'NewComponent' : 'NewSceneLogic';
    const rawName = await prompt({
      title: `Create New ${type === 'component' ? 'Component' : 'Logic'}`,
      message: 'Enter script name:',
      defaultValue: defaultName,
      confirmText: 'Create'
    });

    if (rawName?.trim()) {
      const validName = getValidUniqueName(rawName.trim());
      const newScript = scriptSchema({
        id: GenerateUUID(),
        projectId,
        folderId: targetFolderId,
        scriptId: validName,
        type
      });

      await scriptStore.addScript(newScript);
      projectStore.markAsDirty();

      showPop({
        title: 'Script Created',
        message: `"${validName}" created successfully.`,
        type: 'success'
      });

      return newScript;
    }
    return null;
  };

  const deleteScript = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return false;

    const isConfirmed = await confirm({
      title: 'Delete Script',
      message: `Are you sure you want to delete "${script.scriptId}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      await scriptStore.removeScript(scriptId);
      projectStore.markAsDirty();

      showPop({
        title: 'Deleted',
        message: `Script "${script.scriptId}" removed.`,
        type: 'info'
      });
      return true;
    }
    return false;
  };

  const renameScript = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    const currentName = script.scriptId;
    const rawNewName = await prompt({
      title: 'Rename Script',
      defaultValue: currentName,
      confirmText: 'Rename',
      cancelText: 'Cancel'
    });

    if (rawNewName && rawNewName.trim() !== '') {
      const sanitized = sanitizeScriptId(rawNewName.trim());
      if (isScriptIdDuplicate(sanitized, scriptStore.scripts, s => s.scriptId, scriptId)) {
        showPop({ title: 'Duplicate Script', message: `Script "${sanitized}" already exists.`, type: 'warning' });
        return;
      }
      scriptStore.updateScriptInList(scriptId, { scriptId: sanitized });
      await scriptStore.syncScriptsMetaToOPFS();
      projectStore.markAsDirty();

      showPop({
        title: 'Renamed',
        message: `Script renamed to "${sanitized}".`,
        type: 'success'
      });
    }
  };

  const duplicateScript = async (scriptId) => {
    const original = scriptStore.getScriptById(scriptId);
    if (!original) return null;

    const clone = JSON.parse(JSON.stringify(original));
    clone.id = GenerateUUID();
    const baseScriptId = original.scriptId || 'Script';
    const validName = getValidUniqueName(`${baseScriptId}_Copy`);
    clone.scriptId = validName;
    clone.folderId = folderStore.activeFolderId || original.folderId || null;

    await scriptStore.addScript(clone);
    projectStore.markAsDirty();

    showPop({
      title: 'Duplicated',
      message: `Script "${baseScriptId}" copied.`,
      type: 'success'
    });

    return clone;
  };

  // Attaches a script to an entity ScriptController with default variable values
  const applyToEntity = (script, entity) => {
    if (!script || !entity) return;

    const controller = entity.components?.ScriptController;
    if (!controller) return;

    const currentData = Array.isArray(controller.data) 
      ? JSON.parse(JSON.stringify(controller.data)) 
      : [];

    const isAlreadyAttached = currentData.some(inst => inst.assetId === script.id);

    if (isAlreadyAttached) {
      showPop({
        title: 'Script Exists',
        message: `Script "${script.scriptId}" is already active on ${entity.scriptId}.`,
        type: 'warning'
      });
      return;
    }

    const initialVars = {};
    if (Array.isArray(script.localVariables)) {
      script.localVariables.forEach(v => {
        initialVars[v.name] = v.defaultValue;
      });
    }

    const newInstance = {
      id: generateInstanceId(),
      assetId: script.id,
      active: true,
      variables: initialVars 
    };

    currentData.push(newInstance);
    const updatePayload = { data: currentData };

    if (entity.prefabId) {
      updatePayload.overridden = true;
    }

    sceneStore.patchComponent(entity.id, 'ScriptController', updatePayload);

    showPop({
      title: 'Script Attached',
      message: `Added "${script.scriptId}" to ${entity.scriptId}.`,
      type: 'success'
    });
  };

  return {
    createScript,
    deleteScript,
    renameScript,
    duplicateScript,
    applyToEntity
  };
}
