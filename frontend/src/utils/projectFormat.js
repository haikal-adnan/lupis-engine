import JSZip from 'jszip';

const LUPIS_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]); 

const XOR_KEY = 0x5A; 

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
    throw new Error('File tidak valid atau ukurannya terlalu kecil.');
  }

  for (let i = 0; i < LUPIS_HEADER.length; i++) {
    if (bytes[i] !== LUPIS_HEADER[i]) {
      throw new Error('Format file tidak valid. File ini bukan file proyek Lupis Engine (.lupisproject) yang sah.');
    }
  }

  const zipBytes = new Uint8Array(bytes.length - LUPIS_HEADER.length);
  for (let i = 0; i < zipBytes.length; i++) {
    zipBytes[i] = bytes[LUPIS_HEADER.length + i] ^ XOR_KEY;
  }

  const zip = new JSZip();
  return await zip.loadAsync(zipBytes);
}