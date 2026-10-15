import { ref } from 'vue';
import JSZip from 'jszip';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';

export function useFontConverter() {
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();
  const isConverting = ref(false);

  const convertTtfToBmFont = async (fontFile) => {
    if (!fontFile) return null;

    isConverting.value = true;

    try {
      const backendUrl = workspaceStore.backendBaseUrl || 'http://localhost:4000';
      const formData = new FormData();
      formData.append('file', fontFile);

      const response = await fetch(`${backendUrl}/api/convert-font`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const zipBuffer = await response.arrayBuffer();
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipBuffer);

      const lastDotIndex = fontFile.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? fontFile.name.substring(0, lastDotIndex) : fontFile.name;
      
      let fntFile = null;
      const pngFiles = [];

      for (const [filename, fileObj] of Object.entries(zipContent.files)) {
        if (fileObj.dir) continue;

        if (filename.endsWith('.fnt')) {
          const blob = await fileObj.async('blob');
          fntFile = new File([blob], `${baseName}.fnt`, { type: 'application/octet-stream' });
        } else if (filename.endsWith('.png')) {
          const blob = await fileObj.async('blob');

          let pngName = `${baseName}.png`;
          if (filename !== 'font.png') {
            const indexSuffix = filename.replace('font_', ''); 
            pngName = `${baseName}_${indexSuffix}`;
          }

          pngFiles.push(new File([blob], pngName, { type: 'image/png' }));
        }
      }

      if (!fntFile || pngFiles.length === 0) {
        throw new Error('Incomplete ZIP extraction results (fnt/png not found).');
      }

      console.log('[FontConverter Success]:', {
        fnt: fntFile.name,
        pngs: pngFiles.map(f => f.name)
      });

      return {
        originalFont: fontFile,
        fntFile,
        pngFiles,
      };

    } catch (error) {
      console.error('[FontConverter Error]:', error);
      showPop({
        title: 'Font Conversion Failed',
        message: error.message || 'Failed to convert font file to BMFont.',
        type: 'error',
      });
      return null;
    } finally {
      isConverting.value = false;
    }
  };

  return {
    isConverting,
    convertTtfToBmFont,
  };
}