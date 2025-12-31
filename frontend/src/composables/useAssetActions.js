import { ref } from 'vue'; 
import { useSelection } from '@/composables/useSelection.js';
import { useSyncManager } from '@/composables/useSyncManager.js';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js';
import { bus } from '@engine/Util/EventBus.js'; 

// State Global (Singleton)
const autoResetRect = ref(true);

export function useAssetActions() {
    const { selectedEntity, selectionMode } = useSelection();
    const { registerChange } = useSyncManager();
    const { CDN_URL } = useBackend();
    const { activeProjectId } = useEditorState();

    const getImageSize = (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ w: 100, h: 100 });
            img.src = src;
        });
    };

    // --- FUNGSI UTAMA YANG MEMPERBAIKI MASALAH ---
    const resolveAssetUrl = (asset) => {
        if (!asset) return null;

        // 1. PRIORITAS TERTINGGI: Blob URL dari IndexedDB (Hasil Hydration useBackend)
        // Ini memperbaiki masalah "Masih mencari di server" saat baru upload
        if (asset.fileUrl) return asset.fileUrl;

        // 2. Fallback: Raw Blob (Jaga-jaga jika hydration belum jalan)
        if (asset.localBlob) return URL.createObjectURL(asset.localBlob);

        // 3. Terakhir: Construct CDN URL (Hanya jika tidak ada data lokal)
        const rawCdn = CDN_URL.value || '';
        const baseUrl = rawCdn.replace(/\/$/, "");
        const pId = asset.projectId || activeProjectId.value;
        const key = asset.fileKey; 
        const ext = asset.meta?.extension || '.png';

        if (baseUrl && pId && key) return `${baseUrl}/projects/${pId}/${key}${ext}`;
        
        return null;
    };

    const applyTextureToEntity = async (asset, options = {}) => {
        if (!selectedEntity.value) return;
        if (selectionMode.value !== 'SCENE') return;

        // Cek tipe file image yang valid
        const isImage = asset.type === 'texture' || 
                        asset.itemType === 'image' || 
                        ['texture', 'image', 'sprite'].includes(asset.type) ||
                        (asset.meta?.extension && ['.png','.jpg','.jpeg','.webp'].includes(asset.meta.extension));

        if (!isImage) return;

        const entity = selectedEntity.value;
        if (!entity.components || !entity.components.SpriteRenderer) {
            console.warn("Entity missing SpriteRenderer");
            return;
        }
        
        // Clone Component
        const comp = { ...entity.components.SpriteRenderer };
        comp.assetId = asset._id;

        // Logic Reset Rect
        const shouldReset = options.resetRect !== undefined ? options.resetRect : autoResetRect.value;

        if (shouldReset) {
            let w = 100;
            let h = 100;

            // Ambil dimensi dari metadata jika ada
            if (asset.meta?.dimensions?.w && asset.meta?.dimensions?.h) {
                w = asset.meta.dimensions.w;
                h = asset.meta.dimensions.h;
            } else {
                // Jika tidak ada meta, fetch manual menggunakan resolveAssetUrl
                const url = resolveAssetUrl(asset);
                if (url) {
                    const size = await getImageSize(url);
                    w = size.w;
                    h = size.h;
                }
            }

            // Reset Source & Transform
            comp.source = { x: 0, y: 0, w: w, h: h };
            entity.width = w;
            entity.height = h;

            console.log(`✅ Applied ${asset.name} (Reset: YES, Size: ${w}x${h})`);
        } else {
            console.log(`✅ Applied ${asset.name} (Reset: NO, Keep Transform)`);
        }
        
        // Update Entity
        entity.components.SpriteRenderer = comp;

        bus.emit('entity:modified', [entity]);
        registerChange(entity);
    };

    return {
        applyTextureToEntity,
        resolveAssetUrl, // <--- Penting: Diexport agar dipakai Inspector
        autoResetRect
    };
}