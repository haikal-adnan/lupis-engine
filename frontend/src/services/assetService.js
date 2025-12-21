import { db } from "@/db/index.js";

export async function addLocalAsset(file, projectId, folderId) {
    const newId = `asset_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.assets.add({
        _id: newId,
        projectId,
        folderId,
        name: file.name,
        type: file.type.startsWith('image') ? 'texture' : 'font',
        localBlob: file,
        fileUrl: null,
        isSynced: false,
        meta: {
            extension: `.${file.name.split('.').pop()}`,
            size: file.size
        },
        createdAt: new Date().toISOString()
    });

    return newId;
}

export function getAssetDisplayUrl(asset) {
    if (asset.localBlob) {
        return URL.createObjectURL(asset.localBlob);
    }
    return asset.fileUrl || '';
}

export async function getUnsyncedAssets() {
    return await db.assets.where('isSynced').equals(false).toArray();
}