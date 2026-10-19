export class AssetContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  getAsset(idOrScriptId) {
    if (!idOrScriptId) return null;
    const world = this.game?.world;
    if (world && typeof world.getAsset === 'function') {
      return world.getAsset(idOrScriptId);
    }
    const search = String(idOrScriptId).trim();
    const searchLower = search.toLowerCase();
    const searchSlug = searchLower.replace(/\s+/g, '_');
    if (world?.assetMap?.[search]) return world.assetMap[search];
    const list = world?.assetList || [];
    return list.find(a => 
      a.id === search || 
      (a.scriptId && (a.scriptId.toLowerCase() === searchLower || a.scriptId.toLowerCase() === searchSlug))
    ) || null;
  }

  resolveId(idOrScriptId) {
    if (!idOrScriptId) return null;
    const world = this.game?.world;
    if (world && typeof world.resolveAssetId === 'function') {
      return world.resolveAssetId(idOrScriptId);
    }
    const found = world?.assetMap?.[idOrScriptId];
    if (found && found.id) return found.id;
    const matched = this.getAsset(idOrScriptId);
    return matched ? matched.id : idOrScriptId;
  }

  createFacade() {
    return {
      get: (idOrScriptId) => this.getAsset(idOrScriptId),
      resolveId: (idOrScriptId) => this.resolveId(idOrScriptId)
    };
  }
}
