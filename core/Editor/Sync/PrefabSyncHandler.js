export class PrefabSyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext;
    }

    onCreatePrefab(p) {
        if (!this.ctx.world.prefabs) this.ctx.world.prefabs = {};
        this.ctx.world.prefabs[p.id] = {
            id: p.id,
            scriptId: p.scriptId,
            data: p.data,
            children: p.children || []
        };
    }

    onUpdatePrefab({ id, updates }) {
        if (this.ctx.world.prefabs?.[id]) {
            Object.assign(this.ctx.world.prefabs[id], updates);
        }
    }

    onDeletePrefab(id) {
        if (this.ctx.world.prefabs?.[id]) {
            delete this.ctx.world.prefabs[id];
        }
    }
}