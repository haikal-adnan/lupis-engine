// Diagnostic error classes and metadata resolution utilities for visual script execution contexts

// Thrown when a script contract invariant assertion fails (context.assert.*)
export class ScriptAssertionError extends Error {
  constructor(message, nodeId, nodeType, nodeName = null) {
    super(message);
    this.name = 'ScriptAssertionError';
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.nodeName = nodeName || nodeId;
  }
}

// Resolves diagnostic prefix [Scene] [Entity] [Script] [Node] for console events
export function getScriptContextMetadata(game, runner, node) {
  if (runner && typeof runner.getContextMetadata === 'function') {
    return runner.getContextMetadata(node);
  }

  const sceneName = game?.sceneSystem?.getCurrentSceneScriptId?.() || 
                    game?.world?.currentSceneScriptId || 
                    game?.world?.currentScene?.scriptId || 
                    game?.sceneSystem?.getCurrentSceneId?.() || 
                    'Scene';

  const entityScriptId = runner?.owner 
    ? (runner.owner.scriptId || runner.owner.id || 'Entity') 
    : 'Global';

  const scriptName = runner?.data?.scriptId || 
                     game?.world?.scripts?.[runner?.scriptId]?.scriptId || 
                     runner?.data?.title || 
                     runner?.scriptId || 
                     'Script';

  const nodeName = node ? (
    node.settings?.headerTitle || 
    node.data?.settings?.headerTitle || 
    node.title || 
    node.label || 
    node.type || 
    node.id || 
    'Node'
  ) : 'Node';

  return {
    scene: sceneName,
    entityScriptId: String(entityScriptId),
    script: scriptName,
    node: nodeName,
    prefix: `[${sceneName}] [${entityScriptId}] [${scriptName}] [${nodeName}]`
  };
}

// Formats raw notifications or log values into a human-readable string
export function formatNotificationMessage(message) {
  if (message === undefined || message === null) {
    return String(message ?? '');
  }
  if (message instanceof Map) {
    try {
      return JSON.stringify(Object.fromEntries(message), null, 2);
    } catch {
      return String(message);
    }
  }
  if (message instanceof Set) {
    try {
      return JSON.stringify(Array.from(message), null, 2);
    } catch {
      return String(message);
    }
  }
  if (Array.isArray(message) || (typeof message === 'object' && message !== null)) {
    try {
      return JSON.stringify(message, null, 2);
    } catch {
      return String(message);
    }
  }
  return String(message);
}
