import { db } from "@/db/index.js";

const TYPE_MAPPING = {
    '.png': 'texture', '.jpg': 'texture', '.jpeg': 'texture', '.webp': 'texture',
    '.mp3': 'sound', '.wav': 'sound', '.ogg': 'sound',
    '.ttf': 'font', '.otf': 'font', '.woff': 'font',
    '.js': 'script', '.ts': 'script', '.json': 'script'
};

export async function addLocalAsset(file, projectId, folderId) {
    const newId = `asset_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    const type = TYPE_MAPPING[ext] || 'file'; 
    
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); 
    
    console.log(`Original: ${file.name}, Saved as: ${nameWithoutExt}`);

    let dimensions = { w: 0, h: 0 };
    if (type === 'texture') {
        try {
            dimensions = await new Promise((resolve) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    resolve({ w: img.naturalWidth, h: img.naturalHeight });
                    URL.revokeObjectURL(url); // Clean up memory
                };
                img.onerror = () => resolve({ w: 0, h: 0 });
                img.src = url;
            });
        } catch (e) {
            console.error("Gagal baca dimensi gambar", e);
        }
    }

    const assetData = {
        _id: newId,
        projectId,
        folderId: folderId || null,
        name: nameWithoutExt, 
        type: type,
        localBlob: file, 
        fileUrl: null,
        isSynced: false,
        meta: {
            extension: ext, 
            size: file.size,
            filterMode: 'nearest',
            dimensions: dimensions 
        },
        createdAt: new Date().toISOString()
    };

    await db.assets.add(assetData);
    return assetData;
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

export async function renameLocalAsset(id, newName) {
    await db.assets.update(id, { name: newName, isSynced: false });
}

export async function deleteLocalAsset(id) {
    await db.assets.delete(id);
}

export async function moveLocalAsset(id, newFolderId) {
    await db.assets.update(id, { folderId: newFolderId, isSynced: false });
}

export async function getLocalAssetsByProject(projectId) {
    return await db.assets.where('projectId').equals(projectId).toArray();
}