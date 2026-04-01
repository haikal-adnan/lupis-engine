import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export const createPublished = (data = {}) => {
  return {
    _id: data._id || GenerateUUID(),
    projectId: data.projectId || null,
    ownerId: data.ownerId || null,
    
    title: data.title || "New Published Work",
    slug: data.slug || "", 
    description: data.description || "Created with Lupis Engine.",
    thumbnailUrl: data.thumbnailUrl || null,
    
    playOnBrowser: data.playOnBrowser || false,

    downloads: {
      exe: data.downloads?.exe || null,
      apk: data.downloads?.apk || null,
      bin: data.downloads?.bin || null
    },

    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
};