// Decodes protected assets, obfuscated node code, and unpacks in-memory .lupisproject archives

export const LUPIS_PROJECT_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52,
  0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]); // "LUPIS_PROJECT1!\0"

export const LUPIS_DATA_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x44, 0x41,
  0x54, 0x41, 0x5F, 0x56, 0x31, 0x21, 0x00, 0x00
]); // "LUPIS_DATA_V1!\0\0"

export const LUPIS_XOR_KEY = 0x5A;

export class LupisPackageHelper {
  static _virtualFiles = new Map();
  static _activeArchiveBase = null;

  static hasHeader(bytes, header) {
    if (!bytes || bytes.length < header.length) return false;
    for (let i = 0; i < header.length; i++) {
      if (bytes[i] !== header[i]) return false;
    }
    return true;
  }

  static isLupisDataBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return this.hasHeader(bytes, LUPIS_DATA_HEADER);
  }

  static isLupisProjectBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return this.hasHeader(bytes, LUPIS_PROJECT_HEADER);
  }

  static encodeLupisDataBuffer(buffer) {
    const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const out = new Uint8Array(LUPIS_DATA_HEADER.length + src.length);
    out.set(LUPIS_DATA_HEADER, 0);
    for (let i = 0; i < src.length; i++) {
      out[LUPIS_DATA_HEADER.length + i] = src[i] ^ LUPIS_XOR_KEY;
    }
    return out.buffer;
  }

  static decodeLupisDataBuffer(buffer) {
    if (!buffer) return buffer;
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (!this.hasHeader(bytes, LUPIS_DATA_HEADER)) {
      return buffer instanceof ArrayBuffer ? buffer : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }

    const payloadLength = bytes.length - LUPIS_DATA_HEADER.length;
    const decoded = new Uint8Array(payloadLength);
    for (let i = 0; i < payloadLength; i++) {
      decoded[i] = bytes[LUPIS_DATA_HEADER.length + i] ^ LUPIS_XOR_KEY;
    }
    return decoded.buffer;
  }

  static encodeObfuscatedCode(codeStr) {
    if (typeof codeStr !== 'string' || !codeStr) return '';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(codeStr);
    const masked = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      masked[i] = bytes[i] ^ LUPIS_XOR_KEY;
    }
    let binary = '';
    for (let i = 0; i < masked.length; i++) {
      binary += String.fromCharCode(masked[i]);
    }
    return typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(masked).toString('base64');
  }

  static decodeObfuscatedCode(encodedStr) {
    if (typeof encodedStr !== 'string' || !encodedStr) return '';
    try {
      let masked;
      if (typeof atob === 'function') {
        const binary = atob(encodedStr);
        masked = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          masked[i] = binary.charCodeAt(i);
        }
      } else {
        masked = new Uint8Array(Buffer.from(encodedStr, 'base64'));
      }
      const unmasked = new Uint8Array(masked.length);
      for (let i = 0; i < masked.length; i++) {
        unmasked[i] = masked[i] ^ LUPIS_XOR_KEY;
      }
      return new TextDecoder('utf-8').decode(unmasked);
    } catch (err) {
      console.error('[LupisPackageHelper] Failed to decode obfuscated node code:', err);
      return '';
    }
  }

  static clearVirtualArchive() {
    this._virtualFiles.clear();
    this._activeArchiveBase = null;
  }

  static hasVirtualArchive() {
    return this._virtualFiles.size > 0;
  }

  static _normalizeVirtualKey(urlOrPath) {
    if (!urlOrPath) return '';
    let clean = String(urlOrPath).replace(/\\/g, '/');
    if (this._activeArchiveBase && clean.startsWith(this._activeArchiveBase)) {
      clean = clean.slice(this._activeArchiveBase.length);
    }
    clean = clean.replace(/^(\.\/|\/)+/, '');
    if (clean.startsWith('project/')) {
      clean = clean.slice('project/'.length);
    }
    if (clean.startsWith('data/')) {
      clean = clean.slice('data/'.length);
    }
    return clean;
  }

  static resolveAssetBaseUrl(baseURL = '') {
    if (!baseURL || typeof baseURL !== 'string') return '.';
    const clean = baseURL.replace(/\/$/, '');
    if (clean === './data' || clean === 'data') return '.';
    if (clean.endsWith('/data')) return clean.slice(0, -5) || '.';
    return clean;
  }

  static async _inflateRawBrowser(compressedBytes) {
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedBytes);
      writer.close();
      const response = new Response(ds.readable);
      const ab = await response.arrayBuffer();
      return new Uint8Array(ab);
    }
    throw new Error('DecompressionStream is not supported in this environment.');
  }

  static async loadLupisProjectBuffer(arrayBuffer, baseAlias = './project') {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    if (!this.hasHeader(bytes, LUPIS_PROJECT_HEADER)) {
      throw new Error('Invalid .lupisproject archive: missing LUPIS_PROJECT1 magic header.');
    }

    const zipBytes = new Uint8Array(bytes.length - LUPIS_PROJECT_HEADER.length);
    for (let i = 0; i < zipBytes.length; i++) {
      zipBytes[i] = bytes[LUPIS_PROJECT_HEADER.length + i] ^ LUPIS_XOR_KEY;
    }

    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    let eocdOffset = -1;
    for (let i = zipBytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) {
      throw new Error('Invalid .lupisproject archive: ZIP End of Central Directory not found.');
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);
    const decoder = new TextDecoder('utf-8');

    this._virtualFiles.clear();
    this._activeArchiveBase = String(baseAlias || './project').replace(/\/$/, '');

    for (let i = 0; i < totalEntries; i++) {
      if (view.getUint32(cdOffset, true) !== 0x02014b50) break;

      const compressionMethod = view.getUint16(cdOffset + 10, true);
      const compressedSize = view.getUint32(cdOffset + 20, true);
      const fileNameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const fileNameBytes = zipBytes.subarray(cdOffset + 46, cdOffset + 46 + fileNameLen);
      const rawFileName = decoder.decode(fileNameBytes).replace(/\\/g, '/').replace(/^\/+/, '');

      cdOffset += 46 + fileNameLen + extraLen + commentLen;

      if (rawFileName.endsWith('/')) continue;

      const localFileNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedSlice = zipBytes.subarray(dataStart, dataStart + compressedSize);

      let fileData;
      if (compressionMethod === 0) {
        fileData = new Uint8Array(compressedSlice);
      } else if (compressionMethod === 8) {
        fileData = await this._inflateRawBrowser(compressedSlice);
      } else {
        throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
      }

      this._virtualFiles.set(rawFileName, fileData);
    }

    return this._virtualFiles;
  }

  static async tryLoadArchiveFromUrl(archiveUrl, baseAlias = './project') {
    try {
      const res = await fetch(archiveUrl);
      if (!res.ok) return false;
      const buf = await res.arrayBuffer();
      if (!this.isLupisProjectBuffer(buf)) return false;
      await this.loadLupisProjectBuffer(buf, baseAlias);
      return true;
    } catch {
      return false;
    }
  }

  static async fetchBuffer(url) {
    if (this.hasVirtualArchive()) {
      const key = this._normalizeVirtualKey(url);
      if (this._virtualFiles.has(key)) {
        const rawBytes = this._virtualFiles.get(key);
        return this.decodeLupisDataBuffer(rawBytes);
      }
      if ( !key.startsWith('assets/') && this._virtualFiles.has(`assets/${key}`) ) {
        const rawBytes = this._virtualFiles.get(`assets/${key}`);
        return this.decodeLupisDataBuffer(rawBytes);
      }
    }

    let res = await fetch(url);
    if (!res.ok) {
      const altUrls = [];
      if (url.includes('/data/assets/')) {
        altUrls.push(url.replace('/data/assets/', '/assets/'));
      } else if (url.includes('/project/assets/')) {
        altUrls.push(url.replace('/project/assets/', '/assets/'));
      } else if (url.startsWith('./assets/')) {
        altUrls.push(url.replace('./assets/', './data/assets/'));
        altUrls.push(url.replace('./assets/', './project/assets/'));
      }
      for (const altUrl of altUrls) {
        try {
          const altRes = await fetch(altUrl);
          if (altRes.ok) {
            res = altRes;
            break;
          }
        } catch {}
      }
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch asset buffer from ${url} (HTTP ${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return this.decodeLupisDataBuffer(arrayBuffer);
  }

  static async fetchText(url) {
    const buffer = await this.fetchBuffer(url);
    return new TextDecoder('utf-8').decode(buffer);
  }

  static async fetchJson(url, fallbackValue = null) {
    try {
      const text = await this.fetchText(url);
      return JSON.parse(text);
    } catch {
      return fallbackValue;
    }
  }

  static async createDecodedBlobUrl(url, mimeType = 'application/octet-stream') {
    const decodedBuffer = await this.fetchBuffer(url);
    const blob = new Blob([decodedBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }
}

export default LupisPackageHelper;
