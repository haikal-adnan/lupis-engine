import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFolderStore = defineStore('folder', () => {
  const folders = ref([]);
  const activeFolderId = ref(null);

  const getFolderById = computed(() => (id) => {
    return folders.value.find(f => f._id === id);
  });

  const projectFolders = computed(() => folders.value);

  function initFolders(folderList) {
    folders.value = folderList;
  }

  function setActiveFolder(folderId) {
    activeFolderId.value = folderId;
  }

  function createFolder(folder) {
    if (!folder._id) folder._id = `folder_${Date.now()}`;
    folders.value.push(folder);
  }

  function deleteFolder(folderId) {
    folders.value = folders.value.filter(f => f._id !== folderId);
    if (activeFolderId.value === folderId) {
      activeFolderId.value = null;
    }
  }

  function updateFolderName(folderId, newName) {
    const folder = folders.value.find(f => f._id === folderId);
    if (folder) folder.name = newName;
  }

  function duplicateFolder(folderId) {
    const original = folders.value.find(f => f._id === folderId);
    if (!original) return;

    const newFolder = {
      ...original,
      _id: `folder_${Date.now()}_copy`, 
      name: `${original.name} (Copy)`
    };
    folders.value.push(newFolder);
  }

  return {
    folders,
    activeFolderId,
    getFolderById,
    projectFolders,
    initFolders,
    setActiveFolder,
    createFolder,
    deleteFolder,
    updateFolderName,
    duplicateFolder
  };
});