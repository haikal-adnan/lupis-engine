import { ref } from 'vue';
import { usePopAlert } from '@composables/composables.js';
import { generateMsdfBmFont } from './msdfGenerator.js';

export function useFontConverter() {
  const { showPop } = usePopAlert();
  const isConverting = ref(false);

  const convertTtfToBmFont = async (fontFile) => {
    if (!fontFile) return null;

    isConverting.value = true;

    try {
      const fontBuffer = await fontFile.arrayBuffer();
      const lastDotIndex = fontFile.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? fontFile.name.substring(0, lastDotIndex) : fontFile.name;

      const { fntContent, pngBuffers } = await generateMsdfBmFont(fontBuffer, {
        faceName: baseName,
        fileName: baseName,
        fontSize: 32,
        distanceRange: 8,
        texturePadding: 8,
        textureSize: 2048,
      });

      const fntFile = new File([fntContent], `${baseName}.fnt`, { type: 'application/octet-stream' });
      const pngFiles = pngBuffers.map((buf, index) => {
        const pngName = pngBuffers.length === 1 ? `${baseName}.png` : `${baseName}_${index}.png`;
        return new File([buf], pngName, { type: 'image/png' });
      });

      console.log('[FontConverter Client Success]:', {
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
      const message = error.message || 'Failed to convert font file to BMFont.';
      showPop({
        title: 'Font Conversion Failed',
        message,
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
