import { useScriptStore } from '@scripts/scripts.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';
import { useFolderStore } from '@folders/folders.js';
import { scriptSchema } from '@scripts/scripts.js';
import { GenerateUUID } from '@utils/utils.js';

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
    let cleanName = desiredName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    
    if (!cleanName) cleanName = 'New_Script';

    let finalName = cleanName;
    let counter = 1;

    const isNameTaken = (nameToCheck) => {
      return scriptStore.scripts.some(s => 
        s.id !== excludeId && 
        s.name.toLowerCase() === nameToCheck.toLowerCase()
      );
    };

    while (isNameTaken(finalName)) {
      finalName = `${cleanName}_${counter}`;
      counter++;
    }

    return finalName;
  };

  const createScript = async (type = 'component', folderId = null) => {
    const projectId = projectStore.project?.id || null;
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
        name: validName,
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
      message: `Are you sure you want to delete "${script.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      await scriptStore.removeScript(scriptId);
      projectStore.markAsDirty();

      showPop({
        title: 'Deleted',
        message: `Script "${script.name}" removed.`,
        type: 'info'
      });
      return true;
    }
    return false;
  };

  const renameScript = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    const rawNewName = await prompt({
      title: 'Rename Script',
      defaultValue: script.name,
      confirmText: 'Rename',
      cancelText: 'Cancel'
    });

    if (rawNewName && rawNewName.trim() !== '') {
      const validName = getValidUniqueName(rawNewName.trim(), scriptId);
      if (validName !== script.name) {
        // 1. Update state di RAM
        scriptStore.updateScriptInList(scriptId, { name: validName });

        // 2. Persist metadata nama baru ke OPFS (Tambahkan baris ini)
        await scriptStore.syncScriptsMetaToOPFS();

        // 3. Mark project dirty
        projectStore.markAsDirty();

        showPop({
          title: 'Renamed',
          message: `Script renamed to "${validName}".`,
          type: 'success'
        });
      }
    }
  };

  const duplicateScript = async (scriptId) => {
    const original = scriptStore.getScriptById(scriptId);
    if (!original) return null;

    const clone = JSON.parse(JSON.stringify(original));
    clone.id = GenerateUUID();
    clone.name = getValidUniqueName(`${original.name}_Copy`);
    clone.folderId = folderStore.activeFolderId || original.folderId || null;

    await scriptStore.addScript(clone);
    projectStore.markAsDirty();

    showPop({
      title: 'Duplicated',
      message: `Script "${original.name}" copied.`,
      type: 'success'
    });

    return clone;
  };

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
        message: `Script "${script.name}" is already active on ${entity.name}.`,
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
      message: `Added "${script.name}" to ${entity.name}.`,
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