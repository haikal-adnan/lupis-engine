// Subsystem handler providing entity queries, hierarchy traversal, tag filtering, and lifecycle operations
export class EntityContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner, node, nodeName }) {
    const entitySystem = this.game?.entitySystem;
    const world = this.game?.world;

    return {
      // Resolves an entity by reference, UUID, scriptId, or 'self'
      get: (targetId) => {
        if (!targetId || targetId === 'self') {
          if (!runner.owner) {
            throw new Error(`[ContextSystem] Owner entity does not exist for 'self' target (node: '${nodeName}', type: '${node?.type || 'unknown'}')`);
          }
          return runner.owner;
        }
        if (typeof targetId === 'object' && targetId !== null) {
          return targetId;
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
        let targetEntity = entity;
        if (typeof entity === 'string') {
          if (entity === 'self') {
            targetEntity = runner.owner;
          } else if (entitySystem && typeof entitySystem.getEntity === 'function') {
            targetEntity = entitySystem.getEntity(entity, runner.owner);
          } else {
            const searchKey = String(entity).trim();
            const searchLower = searchKey.toLowerCase();
            const searchSlug = searchLower.replace(/\s+/g, '_');
            const entities = world?.entities || [];
            targetEntity = entities.find(e => 
              e.id === searchKey || 
              (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
            ) || null;
          }
        }
        if (!targetEntity) return;
        if (entitySystem && typeof entitySystem.destroyEntity === 'function') {
          entitySystem.destroyEntity(targetEntity);
        }
      },

      destroyByTag: (tag) => {
        if (!tag) return 0;
        if (entitySystem && typeof entitySystem.destroyEntitiesByTag === 'function') {
          return entitySystem.destroyEntitiesByTag(tag);
        }
        if (entitySystem && typeof entitySystem.destroyByTag === 'function') {
          return entitySystem.destroyByTag(tag);
        }
        const targetTag = String(tag).trim().toLowerCase();
        const entities = world?.entities || [];
        const matches = entities.filter(e => {
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          return String(e.tag || '').trim().toLowerCase() === targetTag;
        });
        let count = 0;
        for (const ent of matches) {
          if (!ent._isDestroyed && entitySystem && typeof entitySystem.destroyEntity === 'function') {
            entitySystem.destroyEntity(ent);
            count++;
          }
        }
        return count;
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

      getChildByName: (entity, childName) => {
        if (!entity || !childName) return null;
        const entities = world?.entities || [];
        let parentEnt = entity;
        if (typeof entity === 'string') {
          parentEnt = (entitySystem && typeof entitySystem.getEntity === 'function')
            ? entitySystem.getEntity(entity, runner.owner)
            : entities.find(e => e.id === entity || e.scriptId === entity);
        }
        if (!parentEnt) return null;
        const children = (entitySystem && typeof entitySystem.getChildren === 'function')
          ? entitySystem.getChildren(parentEnt)
          : entities.filter(e => e.parentId === parentEnt.id);
        const search = String(childName).trim().toLowerCase();
        return children.find(c => {
          const sId = String(c.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        }) || null;
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

      // Finds the nearest entity matching a tag using squared distance
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

        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return null;

        for (const other of entities) {
          if (other.active === false || other._isDestroyed) continue;
          if (excludeId && other.id === excludeId) continue;
          const match = typeof other.hasTag === 'function'
            ? other.hasTag(targetTag)
            : (Array.isArray(other.tags)
                ? other.tags.some(t => String(t).trim().toLowerCase() === targetTag)
                : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetTag);
          if (match) {
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

      getAll: () => {
        const entities = world?.entities || [];
        return entities.filter(e => !e._isDestroyed && e.active !== false);
      },

      getAllByTag: (tag) => {
        if (entitySystem && typeof entitySystem.getAllByTag === 'function') {
          return entitySystem.getAllByTag(tag);
        }
        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return [];
        const entities = world?.entities || [];
        return entities.filter(e => {
          if (e.active === false || e._isDestroyed) return false;
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          const otherTag = e.tag || e.components?.Tags?.value;
          return String(otherTag || '').trim().toLowerCase() === targetTag;
        });
      },

      countByTag: (tag) => {
        if (!tag) return 0;
        if (entitySystem && typeof entitySystem.getAllByTag === 'function') {
          return entitySystem.getAllByTag(tag).length;
        }
        const targetTag = String(tag).trim().toLowerCase();
        const entities = world?.entities || [];
        return entities.filter(e => {
          if (e.active === false || e._isDestroyed) return false;
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          const otherTag = e.tag || e.components?.Tags?.value;
          return String(otherTag || '').trim().toLowerCase() === targetTag;
        }).length;
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
