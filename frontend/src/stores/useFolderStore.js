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
    // Pastikan ID ada
    if (!folder._id) folder._id = `folder_${Date.now()}`;
    folders.value.push(folder);
    // Opsional: langsung masuk ke folder baru
    // setActiveFolder(folder._id); 
  }

  function deleteFolder(folderId) {
    folders.value = folders.value.filter(f => f._id !== folderId);
    // Hapus juga sub-folder jika perlu (recursive logic bisa ditambahkan di sini)
    if (activeFolderId.value === folderId) {
      activeFolderId.value = null;
    }
  }

  function updateFolderName(folderId, newName) {
    const folder = folders.value.find(f => f._id === folderId);
    if (folder) folder.name = newName;
  }

  // [BARU] Action untuk duplicate folder
  function duplicateFolder(folderId) {
    const original = folders.value.find(f => f._id === folderId);
    if (!original) return;

    const newFolder = {
      ...original,
      _id: `folder_${Date.now()}_copy`, // Generate new ID
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
    duplicateFolder // Export function baru
  };
});