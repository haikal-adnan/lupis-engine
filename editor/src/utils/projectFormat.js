import JSZip from 'jszip';
import { LUPIS_HEADER, XOR_KEY } from '@utils/utils.js'


export async function encodeLupisProject(zipBlob) {
  const zipArrayBuffer = await zipBlob.arrayBuffer();
  const zipBytes = new Uint8Array(zipArrayBuffer);
  
  const outputBuffer = new Uint8Array(LUPIS_HEADER.length + zipBytes.length);
  outputBuffer.set(LUPIS_HEADER, 0);
  
  for (let i = 0; i < zipBytes.length; i++) {
    outputBuffer[LUPIS_HEADER.length + i] = zipBytes[i] ^ XOR_KEY;
  }
  
  return new Blob([outputBuffer], { type: 'application/octet-stream' });
}

export async function decodeLupisProject(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  if (bytes.length < LUPIS_HEADER.length) {
    throw new Error('Invalid file or file size is too small.');
  }

  for (let i = 0; i < LUPIS_HEADER.length; i++) {
    if (bytes[i] !== LUPIS_HEADER[i]) {
      throw new Error('Invalid file format. This is not a valid Lupis Engine project file (.lupisproject).');
    }
  }

  const zipBytes = new Uint8Array(bytes.length - LUPIS_HEADER.length);
  for (let i = 0; i < zipBytes.length; i++) {
    zipBytes[i] = bytes[LUPIS_HEADER.length + i] ^ XOR_KEY;
  }

  const zip = new JSZip();
  return await zip.loadAsync(zipBytes);
}