export class EntityContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner, node, nodeName }) {
    const entitySystem = this.game?.entitySystem;
    const world = this.game?.world;

    return {
      get: (targetId) => {
        if (!targetId || targetId === 'self') {
          if (!runner.owner) {
            throw new Error(`[ContextSystem] Owner entity does not exist for 'self' target (node: '${nodeName}', type: '${node?.type || 'unknown'}')`);
          }
          return runner.owner;
        }
        if (entitySystem && typeof entitySystem.getEntity === 'function') {
          return entitySystem.getEntity(targetId, runner.owner);
        }
        const searchKey = String(targetId).trim();
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          e.id === searchKey || 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
      },

      destroy: (entity) => {
        if (!entity) return;
        if (entitySystem && typeof entitySystem.destroyEntity === 'function') {
          entitySystem.destroyEntity(entity);
        }
      },

      clone: (entity) => {
        return entitySystem && typeof entitySystem.cloneEntity === 'function' ? entitySystem.cloneEntity(entity) : null;
      },

      getParent: (entity) => {
        if (entitySystem && typeof entitySystem.getParent === 'function') {
          return entitySystem.getParent(entity);
        }
        if (!entity || !entity.parentId) return null;
        const entities = world?.entities || [];
        return entities.find(e => e.id === entity.parentId) || null;
      },

      getChildren: (entity) => {
        if (entitySystem && typeof entitySystem.getChildren === 'function') {
          return entitySystem.getChildren(entity);
        }
        if (!entity) return [];
        const entities = world?.entities || [];
        return entities.filter(e => e.parentId === entity.id);
      },

      getRoot: (entity) => {
        if (entitySystem && typeof entitySystem.getRoot === 'function') {
          return entitySystem.getRoot(entity);
        }
        if (!entity) return null;
        let current = entity;
        const entities = world?.entities || [];
        while (current && current.parentId) {
          const parent = entities.find(e => e.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
        return current;
      },

      findClosestByTag: (tag, fromXOrEntity, optFromY) => {
        if (entitySystem && typeof entitySystem.findClosestByTag === 'function') {
          return entitySystem.findClosestByTag(tag, fromXOrEntity, optFromY);
        }
        const entities = world?.entities || [];
        let originX = 0;
        let originY = 0;
        let excludeId = null;

        if (typeof fromXOrEntity === 'object' && fromXOrEntity !== null) {
          excludeId = fromXOrEntity.id;
          const t = fromXOrEntity.components?.Transform || fromXOrEntity.components?.UITransform;
          originX = t ? (t.x || 0) : 0;
          originY = t ? (t.y || 0) : 0;
        } else {
          originX = Number(fromXOrEntity) || 0;
          originY = Number(optFromY) || 0;
        }

        let closest = null;
        let minDistanceSq = Infinity;

        for (const other of entities) {
          if (other.active === false) continue;
          if (excludeId && other.id === excludeId) continue;
          const otherTag = other.tag || other.components?.Tags?.value;
          if (otherTag === tag) {
            const t = other.components?.Transform || other.components?.UITransform;
            const ox = t ? (t.x || 0) : 0;
            const oy = t ? (t.y || 0) : 0;
            const dx = ox - originX;
            const dy = oy - originY;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistanceSq) {
              minDistanceSq = distSq;
              closest = other;
            }
          }
        }
        return closest;
      },

      getAllByTag: (tag) => {
        if (entitySystem && typeof entitySystem.getAllByTag === 'function') {
          return entitySystem.getAllByTag(tag);
        }
        const entities = world?.entities || [];
        return entities.filter(e => {
          if (e.active === false) return false;
          const otherTag = e.tag || e.components?.Tags?.value;
          return otherTag === tag;
        });
      },

      findByName: (name) => {
        if (entitySystem && typeof entitySystem.findByName === 'function') {
          return entitySystem.findByName(name);
        }
        const searchLower = String(name).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug)) || 
          e.id === name
        ) || null;
      },

      findByScriptId: (scriptId) => {
        if (entitySystem && typeof entitySystem.findByScriptId === 'function') {
          return entitySystem.findByScriptId(scriptId);
        }
        const searchLower = String(scriptId).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
      }
    };
  }
}
