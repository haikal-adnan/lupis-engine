// import Config from "../Core/Config.js";

// export function PrepareRenderConfig(game, world) {
//     const renderConfig = {
//         isTilemapMode: false,
//         activeTabId: null,
//         showOthers: true,
//         opacityOthers: 1,
//         selectedIds: []
//     };

//     if (Config.ENGINE_MODE !== "editor") {
//         return renderConfig;
//     }

//     const editors = world._editors || {};
//     const activeTabId = editors.activeTabId;
//     const tabs = editors.tabs || [];
//     const ctxSettings = editors.tilemapContext || { showOthers: true, opacity: 1 };

//     // 1. CEK MODE TILEMAP
//     let isTilemapMode = false;

//     // Cek via Tab Type
//     const currentTab = tabs.find(t => t.id === activeTabId);
//     if (currentTab && currentTab.type === 'tilemap') {
//         isTilemapMode = true;
//     } 
//     // Fallback: Cek via Component Entity
//     else if (activeTabId && activeTabId !== 'scene-main') {
//         const targetEntity = world.layers
//             .flatMap(l => l.entities || [])
//             .find(e => e.id === activeTabId);
        
//         if (targetEntity && targetEntity.components && targetEntity.components.Tilemap) {
//             isTilemapMode = true;
//         }
//     }

//     // 2. LOGIC TOOL ACTIVATION (Side Effect ke Game System)
//     // Mengatur apakah selection/transform aktif berdasarkan tool yang dipilih
//     if (game.selection && game.transform) {
//         if (isTilemapMode) {
//             // DI MODE TILEMAP: Gizmo hanya aktif jika tool = 'hand'
//             const isHandTool = editors.activeTool === 'hand';
            
//             game.selection.active = isHandTool;
//             game.transform.active = isHandTool;

//             // Bersihkan visual seleksi jika pindah tool dari hand ke brush
//             if (!isHandTool && game.selection.clearSelection) {
//                  game.selection.clearSelection();
//             }
//         } else {
//             // DI SCENE MODE: Selalu aktif
//             game.selection.active = true;
//             game.transform.active = true;
//         }
//     }

//     // 3. POPULATE CONFIG OBJECT
//     renderConfig.isTilemapMode = isTilemapMode;
//     renderConfig.activeTabId = activeTabId;
//     renderConfig.showOthers = ctxSettings.showOthers;
//     renderConfig.opacityOthers = ctxSettings.opacity;
//     renderConfig.selectedIds = game.selection?.selectedList.map(e => e.id) || [];

//     return renderConfig;
// }