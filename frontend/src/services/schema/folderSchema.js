// services/schema/folderSchema.js

export const createFolder = (data = {}) => {
  return {
    // 1. Identitas
    _id: data._id || `folder_${Date.now()}`,
    type: 'folder',

    // 2. Data Utama
    name: data.name || "New Folder",
    projectId: data.projectId || null, // Penting untuk relasi database
    parentId: data.parentId || null,   // null menandakan folder ini ada di Root

    // 3. UI State (Khusus Editor)
    // Berguna untuk TreeView: menyimpan status buka/tutup folder
    _editor: {
      expanded: data._editor?.expanded ?? false, // Default tertutup
      selected: data._editor?.selected ?? false,
      isRenaming: data._editor?.isRenaming ?? false
    }
  };
};