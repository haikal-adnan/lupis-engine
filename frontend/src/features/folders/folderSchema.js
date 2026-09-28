export const folderSchema = (data = {}) => {
  const folderId = data.id || `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: folderId,
    type: 'folder',
    
    name: data.name || "New Folder",
    section: data.section, 
    projectId: data.projectId || null, 
    parentId: data.parentId || null,
    isSynced: data.isSynced !== undefined ? data.isSynced : true
  };
};