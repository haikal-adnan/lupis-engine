import { useSceneStore } from '@/stores/scene/useSceneStore';

export function useNodeActions() {
  const sceneStore = useSceneStore();

  // Logic Genetik untuk Menambah Input
  const addDynamicInput = (nodeId) => {
    // 1. Ambil data node langsung dari store (reaktif)
    // Asumsi sceneStore.findNodeById mengembalikan referensi reaktif
    const scene = sceneStore.activeScene;
    const node = scene.entities.find(n => n._id === nodeId) || scene.nodes.find(n => n._id === nodeId); // Sesuaikan struktur data Anda
    
    if (!node) return;

    // 2. Tentukan ID baru (Auto Increment untuk string, atau UUID untuk logic lain)
    const currentCount = node.inputs.length;
    const newId = String(currentCount); // "2", "3", dst...

    // 3. Define input baru
    const newInput = {
      _id: newId,
      label: `{${newId}}`, // Label otomatis mengikuti index
      type: 'any',
      color: '#fff'
    };

    // 4. Update Store
    // Karena Vue 3 Reactive, push langsung biasanya aman jika node diambil dari ref store
    // Tapi lebih baik pakai action store resmi jika ada
    node.inputs.push(newInput);
  };

  // Logic Generic untuk Menghapus Input Terakhir
  const removeDynamicInput = (nodeId) => {
    const scene = sceneStore.activeScene;
    const node = scene.entities.find(n => n._id === nodeId); 
    
    // Jangan hapus jika sisa input tinggal 2 (opsional, untuk safety)
    if (!node || node.inputs.length <= 2) return;

    // Hapus yang terakhir
    node.inputs.pop();
    
    // TODO: Bersihkan koneksi (edges) yang terhubung ke pin yang baru dihapus
    // sceneStore.removeEdgesConnectedTo(nodeId, removedInputId);
  };

  return {
    addDynamicInput,
    removeDynamicInput
  };
}