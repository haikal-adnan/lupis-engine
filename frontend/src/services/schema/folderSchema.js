export const createFolder = (data = {}) => {
  return {
    _id: data._id || `folder_${Date.now()}`,
    type: 'folder',

    name: data.name || "New Folder",
    projectId: data.projectId || null, 
    parentId: data.parentId || null, 
  };
};