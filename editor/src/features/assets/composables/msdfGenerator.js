import { Msdfgen } from 'msdfgen-wasm';

const DEFAULT_CHARSET = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

let _cachedMsdfgenPromise = null;

/**
 * Loads the WebAssembly binary for msdfgen across browser and Node.js / test environments.
 */
async function loadMsdfgenWasmBinary(customWasm) {
  if (customWasm) {
    return customWasm instanceof Uint8Array ? customWasm.buffer : customWasm;
  }

  // 1. Node.js / Vitest / SSR environment: Read directly from local filesystem
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fsMod = 'fs';
      const pathMod = 'path';
      const fs = await import(/* @vite-ignore */ fsMod);
      const path = await import(/* @vite-ignore */ pathMod);
      const candidatePaths = [
        path.resolve(process.cwd(), 'editor/public/wasm/msdfgen.wasm'),
        path.resolve(process.cwd(), 'public/wasm/msdfgen.wasm'),
        path.resolve(process.cwd(), 'editor/node_modules/msdfgen-wasm/wasm/msdfgen.wasm'),
        path.resolve(process.cwd(), 'node_modules/msdfgen-wasm/wasm/msdfgen.wasm'),
        path.resolve(process.cwd(), '../editor/public/wasm/msdfgen.wasm'),
        path.resolve(process.cwd(), '../tests/test-data/../editor/public/wasm/msdfgen.wasm')
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }
      }
    } catch {
      // Fall through to browser fetch
    }
  }

  // 2. Real Browser environment: Fetch from /wasm/msdfgen.wasm
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const wasmUrl = new URL('/wasm/msdfgen.wasm', window.location.origin).href;
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch msdfgen.wasm: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }

  throw new Error('Could not resolve or load msdfgen.wasm binary.');
}

/**
 * Returns a cached, initialized Msdfgen instance.
 */
export async function getMsdfgen(customWasm = null) {
  if (!_cachedMsdfgenPromise || customWasm) {
    _cachedMsdfgenPromise = (async () => {
      const wasmBuffer = await loadMsdfgenWasmBinary(customWasm);
      return await Msdfgen.create(wasmBuffer);
    })();
  }
  return await _cachedMsdfgenPromise;
}

// Pre-warm the WebAssembly MSDF generator during browser idle time to avoid first-upload latency
if (typeof window !== 'undefined') {
  const prewarm = () => {
    getMsdfgen().catch(() => {});
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(prewarm);
  } else {
    setTimeout(prewarm, 1000);
  }
}

/**
 * Escapes characters for XML attribute strings.
 */
function escapeXmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates BMFont XML string compatible with GLFontResource and AngelCode BMFont specification.
 */
function buildBmFontXml({
  faceName,
  fontSize,
  texturePadding,
  lineHeight,
  base,
  scaleW,
  scaleH,
  distanceRange,
  pages,
  chars,
  kernings = []
}) {
  let xml = '<?xml version="1.0"?>\n<font>\n';
  xml += `    <info face="${escapeXmlAttr(faceName)}" size="${fontSize}" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="1" aa="1" padding="${texturePadding},${texturePadding},${texturePadding},${texturePadding}" spacing="0,0"/>\n`;
  xml += `    <common lineHeight="${lineHeight}" base="${base}" scaleW="${scaleW}" scaleH="${scaleH}" pages="${pages.length}" packed="0" alphaChnl="0" redChnl="0" greenChnl="0" blueChnl="0"/>\n`;
  xml += '    <pages>\n';
  pages.forEach((p, idx) => {
    xml += `        <page id="${idx}" file="${escapeXmlAttr(p)}"/>\n`;
  });
  xml += '    </pages>\n';
  xml += `    <distanceField fieldType="msdf" distanceRange="${distanceRange}"/>\n`;
  xml += `    <chars count="${chars.length}">\n`;
  chars.forEach(c => {
    xml += `        <char id="${c.id}" index="${c.index}" char="${escapeXmlAttr(c.char)}" width="${c.width}" height="${c.height}" xoffset="${c.xoffset}" yoffset="${c.yoffset}" xadvance="${c.xadvance}" chnl="15" x="${c.x}" y="${c.y}" page="${c.page}"/>\n`;
  });
  xml += '    </chars>\n';
  if (kernings.length > 0) {
    xml += `    <kernings count="${kernings.length}">\n`;
    kernings.forEach(k => {
      xml += `        <kerning first="${k.first}" second="${k.second}" amount="${k.amount}"/>\n`;
    });
    xml += '    </kernings>\n';
  }
  xml += '</font>\n';
  return xml;
}

/**
 * Generates an MSDF bitmap font atlas (.fnt XML + .png atlas textures) entirely client-side.
 *
 * @param {ArrayBuffer|Uint8Array} fontBuffer - Raw bytes of the TTF/OTF font file.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.faceName="font"] - Font family/face name for the BMFont descriptor.
 * @param {string} [options.fileName="font"] - Base file name for generated pages.
 * @param {number} [options.fontSize=32] - Primary font size in pixels (default: 32).
 * @param {number} [options.distanceRange=8] - Distance field range in pixels (default: 8).
 * @param {number} [options.texturePadding=8] - Padding between glyphs in atlas (default: 8).
 * @param {number} [options.textureSize=2048] - Maximum width and height of atlas texture (default: 2048).
 * @param {string|number[]} [options.charset] - Custom characters or unicode codepoints.
 * @param {ArrayBuffer} [options.wasmBinary] - Optional custom WebAssembly binary buffer.
 * @returns {Promise<{ fntContent: string, pngBuffers: Uint8Array[] }>}
 */
export async function generateMsdfBmFont(fontBuffer, options = {}) {
  const {
    faceName = 'font',
    fileName = 'font',
    fontSize = 32,
    distanceRange = 8,
    texturePadding = 8,
    textureSize = 2048,
    charset = null,
    wasmBinary = null
  } = options;

  const msdf = await getMsdfgen(wasmBinary);
  const uint8Font = fontBuffer instanceof Uint8Array ? fontBuffer : new Uint8Array(fontBuffer);

  msdf.loadFont(uint8Font);

  // Determine characters to load
  let charCodes = [];
  if (Array.isArray(charset)) {
    charCodes = charset.map(c => typeof c === 'string' ? c.charCodeAt(0) : Number(c));
  } else if (typeof charset === 'string' && charset.length > 0) {
    charCodes = charset.split('').map(c => c.charCodeAt(0));
  } else {
    charCodes = DEFAULT_CHARSET.split('').map(c => c.charCodeAt(0));
  }

  // Load glyphs with Skia preprocessing enabled
  msdf.loadGlyphs(charCodes, { preprocess: true });

  // If no printable glyphs matched the initial set (e.g. icon/symbol font), scan icon/extended unicode blocks
  const hasVisibleGlyphs = msdf.glyphs.some(g => (g.right - g.left) > 0 || (g.top - g.bottom) > 0);
  if (!hasVisibleGlyphs) {
    const fallbackCodes = [];
    // Private Use Area (common for icon fonts like FontAwesome): 0xE000 - 0xF300
    for (let cp = 0xf000; cp <= 0xf300; cp++) fallbackCodes.push(cp);
    // Latin-1 Supplement: 0x00A0 - 0x00FF
    for (let cp = 0x00a0; cp <= 0x00ff; cp++) fallbackCodes.push(cp);
    fallbackCodes.push(32);
    msdf.loadGlyphs(fallbackCodes, { preprocess: true });
  }

  const metrics = msdf.metrics;
  const pad = distanceRange >> 1; // 4 for distanceRange=8
  const baseline = Math.round(metrics.ascenderY * fontSize);
  const lineHeight = Math.round((metrics.ascenderY - metrics.descenderY) * fontSize);

  // Pack glyphs into atlas bins
  const bins = msdf.packGlyphs(
    {
      size: fontSize,
      range: distanceRange,
      edgeColoring: 'simple',
      edgeThresholdAngle: 3
    },
    {
      maxWidth: textureSize,
      maxHeight: textureSize,
      padding: texturePadding,
      pot: true,
      smart: true,
      allowRotation: false
    }
  );

  if (!bins || bins.length === 0) {
    throw new Error('Font atlas packing produced no valid texture bins.');
  }

  // Ensure every bin has valid non-zero dimensions for libpng encoding
  bins.forEach(bin => {
    if (!bin.width || bin.width < 16) bin.width = 16;
    if (!bin.height || bin.height < 16) bin.height = 16;
  });

  const pages = [];
  const chars = [];
  const kernings = [];

  bins.forEach((bin, pageIndex) => {
    const pageName = bins.length === 1 ? `${fileName}.png` : `${fileName}_${pageIndex}.png`;
    pages.push(pageName);

    bin.rects.forEach(rect => {
      const g = rect.glyph;
      const xoffset = Math.round(g.left * fontSize) - pad;
      const yoffset = Math.round(baseline - g.top * fontSize) + pad;
      const xadvance = Math.round(g.advance * fontSize);

      chars.push({
        id: g.unicode,
        index: g.index,
        char: String.fromCharCode(g.unicode),
        width: rect.width,
        height: rect.height,
        xoffset,
        yoffset,
        xadvance,
        x: rect.x,
        y: rect.y,
        page: pageIndex
      });

      if (Array.isArray(g.kerning) && g.kerning.length > 0) {
        g.kerning.forEach(([secondGlyph, amount]) => {
          if (amount !== 0) {
            kernings.push({
              first: g.unicode,
              second: secondGlyph.unicode,
              amount: Math.round(amount * fontSize)
            });
          }
        });
      }
    });
  });

  // Ensure space character (ASCII 32) is present in chars mapping even if it has no outline
  if (!chars.some(c => c.id === 32)) {
    const spaceAdvance = Math.round((metrics.spaceAdvance || 0.25) * fontSize);
    chars.unshift({
      id: 32,
      index: 0,
      char: ' ',
      width: 0,
      height: 0,
      xoffset: 0,
      yoffset: 0,
      xadvance: spaceAdvance,
      x: 0,
      y: 0,
      page: 0
    });
  }

  // Sort chars by ID for consistent output
  chars.sort((a, b) => a.id - b.id);

  // Generate PNG image buffer for each atlas bin
  const pngBuffers = bins.map(bin => msdf.createAtlasImage(bin));

  // Build BMFont XML
  const fntContent = buildBmFontXml({
    faceName,
    fontSize,
    texturePadding,
    lineHeight,
    base: baseline + pad,
    scaleW: bins[0].width,
    scaleH: bins[0].height,
    distanceRange,
    pages,
    chars,
    kernings
  });

  return {
    fntContent,
    pngBuffers
  };
}
