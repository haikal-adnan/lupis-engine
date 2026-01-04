// composables/useAssetActions.js
import { ref } from 'vue'; 
import { useSelection } from '@/composables/useSelection.js';
import { useSyncManager } from '@/composables/useSyncManager.js';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js';
import { bus } from '@engine/Util/EventBus.js'; 

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

    const resolveAssetUrl = (asset) => {
        if (!asset) return null;
        if (asset.fileUrl) return asset.fileUrl;
        if (asset.localBlob) return URL.createObjectURL(asset.localBlob);

        const rawCdn = CDN_URL.value || '';
        const baseUrl = rawCdn.replace(/\/$/, "");
        const pId = asset.projectId || activeProjectId.value;
        const key = asset.fileKey; 
        const ext = asset.meta?.extension || '.png';

        if (baseUrl && pId && key) return `${baseUrl}/projects/${pId}/${key}${ext}`;
        return null;
    };

    const applyAssetToEntity = async (asset, options = {}) => {
        if (!selectedEntity.value) return;
        if (selectionMode.value !== 'SCENE') return;

        const entity = selectedEntity.value;

        // --- IMAGE LOGIC ---
        const isImage = ['texture', 'image', 'sprite'].includes(asset.type) || 
                        asset.itemType === 'image' || 
                        (asset.meta?.extension && ['.png','.jpg','.jpeg','.webp'].includes(asset.meta.extension));

        if (isImage) {
            if (!entity.components || !entity.components.SpriteRenderer) {
                console.warn("Entity missing SpriteRenderer");
                return;
            }
            const comp = { ...entity.components.SpriteRenderer };
            comp.assetId = asset._id;

            const shouldReset = options.resetRect !== undefined ? options.resetRect : autoResetRect.value;
            if (shouldReset) {
                let w = 100, h = 100;
                if (asset.meta?.dimensions?.w) {
                    w = asset.meta.dimensions.w;
                    h = asset.meta.dimensions.h;
                } else {
                    const url = resolveAssetUrl(asset);
                    if (url) {
                        const size = await getImageSize(url);
                        w = size.w; h = size.h;
                    }
                }
                comp.source = { x: 0, y: 0, w, h };
                entity.width = w;
                entity.height = h;
            }
            entity.components.SpriteRenderer = comp;
            bus.emit('entity:modified', [entity]);
            registerChange(entity);
            return;
        }

        // --- FONT LOGIC ---
        const isFont = ['font', 'typeface'].includes(asset.type) || 
                       asset.itemType === 'font' || 
                       (asset.meta?.extension && ['.ttf','.fnt'].includes(asset.meta.extension));

        if (isFont) {
            if (!entity.components || !entity.components.TextRenderer) {
                console.warn("Entity missing TextRenderer");
                return;
            }

            // Update Component Data
            entity.components.TextRenderer.assetId = asset._id;

            console.log(`✅ Applied Font [${asset.name}] to Entity`);
            
            // Trigger Update ke Engine
            bus.emit('entity:modified', [entity]);
            registerChange(entity);
            return;
        }
    };

    return { applyAssetToEntity, resolveAssetUrl, autoResetRect };
}