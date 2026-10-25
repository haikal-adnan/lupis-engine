// OPFS file tree entry item schema factory
export const opfsItemSchema = (data = {}) => ({
  name: data.name || '',
  kind: data.kind || 'file',
  path: data.path || '',
  handle: data.handle || null,
  isOpen: data.isOpen !== undefined ? data.isOpen : false,
  children: Array.isArray(data.children) ? data.children : undefined
});

// OPFS workspace state schema factory
export const opfsSchema = (data = {}) => ({
  fileTree: data.fileTree || [],
  activeFile: data.activeFile || null,
  fileContent: data.fileContent || '',
  imageUrl: data.imageUrl || '',
  isLoading: data.isLoading || false,
  isSaving: data.isSaving || false,
  errorMessage: data.errorMessage || '',
  allowedExtensions: data.allowedExtensions || ['js', 'json', 'png', 'jpg', 'jpeg', 'webp', 'scene', 'prefab']
});

// Determines editor file category from a file name extension
export const getFileTypeByExtension = (fileName = '') => {
  if (!fileName || typeof fileName !== 'string' || !fileName.includes('.')) {
    return 'unsupported';
  }
  const ext = fileName.split('.').pop().toLowerCase();
  if (['js', 'json', 'scene', 'prefab'].includes(ext)) return 'code';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  return 'unsupported';
};
