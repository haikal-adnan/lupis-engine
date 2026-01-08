import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFolderStore = defineStore('folder', () => {
  const folders = ref([]);
  const activeFolderId = ref(null); // null artinya sedang di "Root" atau "All"

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
    folders.value.push(folder);
    setActiveFolder(folder._id);
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

  return {
    folders,
    activeFolderId,
    getFolderById,
    projectFolders,
    initFolders,
    setActiveFolder,
    createFolder,
    deleteFolder,
    updateFolderName
  };
});