import fs from "fs";
import path from "path";
import vm from "vm";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { minify as terserMinify } from "terser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XOR_STRING_KEY = 0x5A;

/**
 * Classifies an engine module path into one of the 4 modular runtime chunks:
 * - lupis.loader.js   : Bootstrapper, VFS (LupisPackageHelper), Loaders, Runtime entry
 * - lupis.core.js     : Engine Core (Game, Entity, World, Config), Loop, Input, Systems, Schema, Utils
 * - lupis.renderer.js : WebGL2 Graphics Pipeline, Shaders, Batching, Font/Image/Audio GPU Resources
 * - lupis.vm.js       : Gameplay Virtual Machine (ScriptRunner, VariableManager, Context, Toolkits)
 */
export function classifyEngineChunk(relPath) {
  const norm = relPath.replace(/\\/g, "/").replace(/^\/+/, "");

  if (
    norm === "Runtime.js" ||
    norm === "Util/LupisPackageHelper.js" ||
    norm.startsWith("Loader/")
  ) {
    return "lupis.loader.js";
  }

  if (
    norm.startsWith("Renderer/") ||
    norm.startsWith("Assets/Fonts/")
  ) {
    return "lupis.renderer.js";
  }

  if (
    norm.startsWith("Script/") ||
    norm.startsWith("Toolkit/")
  ) {
    return "lupis.vm.js";
  }

  return "lupis.core.js";
}

function resolveRelativeModuleId(fromModulePath, importSpecifier) {
  if (!importSpecifier.startsWith(".")) {
    return importSpecifier.replace(/\\/g, "/");
  }
  const fromDir = path.posix.dirname(fromModulePath.replace(/\\/g, "/"));
  return path.posix.normalize(path.posix.join(fromDir, importSpecifier));
}

function parseNamedBindings(braceContent) {
  return braceContent
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const asMatch = part.match(/^([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$/);
      if (asMatch) {
        return { imported: asMatch[1], local: asMatch[2] };
      }
      return { imported: part, local: part };
    });
}

/**
 * Transforms an ES module file from core/ into a registry module body:
 * function(__require, __exports, __module) { ... }
 */
export function transformEsmToRegistryModule(sourceCode, relPath, mapModuleId = (id) => id) {
  const normalizedPath = relPath.replace(/\\/g, "/");
  let code = sourceCode.replace(/\r\n/g, "\n");
  let importCounter = 0;
  const deferredExports = [];

  // Replace import.meta.env references
  code = code.replace(/\bimport\.meta\.env\b/g, "(globalThis.__LUPIS_ENV__ || {})");

  // 1. Transform import DefaultId, { a, b as c } from "spec";
  code = code.replace(
    /^[ \t]*import\s+([A-Za-z0-9_$]+)\s*,\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, defaultIdent, namedPart, specifier) => {
      const targetId = mapModuleId(resolveRelativeModuleId(normalizedPath, specifier));
      const tmpVar = `__imp_${importCounter++}`;
      const bindings = parseNamedBindings(namedPart)
        .map((b) => (b.imported === b.local ? b.imported : `${b.imported}: ${b.local}`))
        .join(", ");
      return `const ${tmpVar} = __require(${JSON.stringify(targetId)}); const ${defaultIdent} = ${tmpVar}.default !== undefined ? ${tmpVar}.default : ${tmpVar}; const { ${bindings} } = ${tmpVar};`;
    }
  );

  // 2. Transform import { a, b as c } from "spec"; (single or multi-line)
  code = code.replace(
    /^[ \t]*import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, namedPart, specifier) => {
      const targetId = mapModuleId(resolveRelativeModuleId(normalizedPath, specifier));
      const bindings = parseNamedBindings(namedPart)
        .map((b) => (b.imported === b.local ? b.imported : `${b.imported}: ${b.local}`))
        .join(", ");
      return `const { ${bindings} } = __require(${JSON.stringify(targetId)});`;
    }
  );

  // 3. Transform import DefaultId from "spec";
  code = code.replace(
    /^[ \t]*import\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, defaultIdent, specifier) => {
      const targetId = mapModuleId(resolveRelativeModuleId(normalizedPath, specifier));
      const tmpVar = `__imp_${importCounter++}`;
      return `const ${tmpVar} = __require(${JSON.stringify(targetId)}); const ${defaultIdent} = ${tmpVar}.default !== undefined ? ${tmpVar}.default : ${tmpVar};`;
    }
  );

  // 4. Transform export * from "spec";
  code = code.replace(
    /^[ \t]*export\s+\*\s+from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, specifier) => {
      const targetId = mapModuleId(resolveRelativeModuleId(normalizedPath, specifier));
      return `Object.assign(__exports, __require(${JSON.stringify(targetId)}));`;
    }
  );

  // 5. Transform export { a, b as c } from "spec";
  code = code.replace(
    /^[ \t]*export\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, namedPart, specifier) => {
      const targetId = mapModuleId(resolveRelativeModuleId(normalizedPath, specifier));
      const tmpVar = `__reexp_${importCounter++}`;
      const assigns = parseNamedBindings(namedPart)
        .map((b) => `__exports.${b.local} = ${tmpVar}.${b.imported};`)
        .join(" ");
      return `const ${tmpVar} = __require(${JSON.stringify(targetId)}); ${assigns}`;
    }
  );

  // 6. Transform export { a, b as c };
  code = code.replace(
    /^[ \t]*export\s*\{([\s\S]*?)\}\s*;?/gm,
    (_, namedPart) => {
      const bindings = parseNamedBindings(namedPart);
      for (const b of bindings) {
        deferredExports.push(`__exports.${b.local} = ${b.imported};`);
      }
      return "";
    }
  );

  // 7. Transform export default class Name ...
  code = code.replace(
    /^[ \t]*export\s+default\s+class\s+([A-Za-z0-9_$]+)/gm,
    (_, className) => {
      deferredExports.push(`__exports.default = ${className};`);
      return `class ${className}`;
    }
  );

  // 8. Transform export default (async)? function Name ...
  code = code.replace(
    /^[ \t]*export\s+default\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/gm,
    (_, asyncKw, funcName) => {
      deferredExports.push(`__exports.default = ${funcName};`);
      return `${asyncKw || ""}function ${funcName}`;
    }
  );

  // 9. Transform export default <expr>
  code = code.replace(
    /^[ \t]*export\s+default\s+/gm,
    "__exports.default = "
  );

  // 10. Transform export class Name ...
  code = code.replace(
    /^[ \t]*export\s+class\s+([A-Za-z0-9_$]+)/gm,
    (_, className) => {
      deferredExports.push(`__exports.${className} = ${className};`);
      return `class ${className}`;
    }
  );

  // 11. Transform export (async)? function Name ...
  code = code.replace(
    /^[ \t]*export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/gm,
    (_, asyncKw, funcName) => {
      deferredExports.push(`__exports.${funcName} = ${funcName};`);
      return `${asyncKw || ""}function ${funcName}`;
    }
  );

  // 12. Transform export const/let/var Name = ...
  code = code.replace(
    /^[ \t]*export\s+(const|let|var)\s+([A-Za-z0-9_$]+)/gm,
    (_, declKw, varName) => {
      deferredExports.push(`__exports.${varName} = ${varName};`);
      return `${declKw} ${varName}`;
    }
  );

  if (deferredExports.length > 0) {
    code += "\n" + deferredExports.join("\n");
  }

  return code;
}

/**
 * Encodes a signed integer into Base64 VLQ for Source Map v3
 */
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function encodeVlq(value) {
  let vlq = value < 0 ? ((-value) << 1) + 1 : value << 1;
  let encoded = "";
  do {
    let digit = vlq & 31;
    vlq >>>= 5;
    if (vlq > 0) digit |= 32;
    encoded += BASE64_CHARS[digit];
  } while (vlq > 0);
  return encoded;
}

/**
 * Builds a valid Source Map v3 JSON string for a development chunk
 */
export function generateSourceMapV3(chunkFileName, moduleEntries, headerLineCount = 2) {
  const sources = [];
  const sourcesContent = [];
  const lineMappings = [];

  for (let i = 0; i < headerLineCount; i++) {
    lineMappings.push("");
  }

  let prevSourceIdx = 0;
  let prevSourceLine = 0;

  moduleEntries.forEach((entry, sourceIdx) => {
    sources.push(`../src/${entry.relPath}`);
    sourcesContent.push(entry.originalCode);

    // Module wrapper header line (e.g. // === Module: ... === and __define(...))
    for (let h = 0; h < entry.wrapperHeaderLines; h++) {
      lineMappings.push("");
    }

    const lineCount = entry.transformedLines;
    for (let srcLine = 0; srcLine < lineCount; srcLine++) {
      const genColDelta = 0;
      const srcIdxDelta = sourceIdx - prevSourceIdx;
      const srcLineDelta = srcLine - prevSourceLine;
      const srcColDelta = 0;

      lineMappings.push(
        encodeVlq(genColDelta) +
        encodeVlq(srcIdxDelta) +
        encodeVlq(srcLineDelta) +
        encodeVlq(srcColDelta)
      );

      prevSourceIdx = sourceIdx;
      prevSourceLine = srcLine;
    }

    // Module wrapper footer line
    for (let f = 0; f < entry.wrapperFooterLines; f++) {
      lineMappings.push("");
    }
  });

  return JSON.stringify({
    version: 3,
    file: chunkFileName,
    sources,
    sourcesContent,
    names: [],
    mappings: lineMappings.join(";")
  });
}

function isRegexBefore(code, pos) {
  let i = pos - 1;
  while (i >= 0 && /\s/.test(code[i])) i--;
  if (i < 0) return true;
  const ch = code[i];
  if ("=(,[!:?&|;{}+-*~^%<>".includes(ch)) return true;
  // Check preceding keyword like return, typeof, case, throw, delete, void, in, of
  const slice = code.slice(Math.max(0, i - 10), i + 1);
  return /\b(return|typeof|case|throw|delete|void|in|of|await|yield)$/.test(slice);
}

/**
 * Lexical scanner that strips comments and optionally encodes string literals
 * for heavy obfuscation while safely preserving regexes and template literals.
 */
export function scanAndTransformJs(code, options = {}) {
  const { encodeStrings = false, stringTable = [], stringIndexMap = new Map(), decoderIdent = "_0xD" } = options;
  let out = "";
  const len = code.length;
  let i = 0;

  while (i < len) {
    const ch = code[i];
    const next = code[i + 1];

    // 1. Single-line comment
    if (ch === "/" && next === "/") {
      i += 2;
      while (i < len && code[i] !== "\n") i++;
      continue;
    }

    // 2. Multi-line comment
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < len && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // 3. String literal ('...' or "...")
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let start = i;
      i++;
      let rawContent = "";
      let hasInvalidEscape = false;
      while (i < len && code[i] !== quote) {
        if (code[i] === "\\") {
          rawContent += code[i] + (code[i + 1] || "");
          i += 2;
        } else {
          if (code[i] === "\n" || code[i] === "\r") hasInvalidEscape = true;
          rawContent += code[i];
          i++;
        }
      }
      i++; // closing quote
      const fullLiteral = code.slice(start, i);

      // Look ahead to check if followed by ':' or '(' (object property key or method name)
      let lookahead = i;
      while (lookahead < len && /\s/.test(code[lookahead])) lookahead++;
      const nextTokenChar = code[lookahead];

      if (
        encodeStrings &&
        !hasInvalidEscape &&
        nextTokenChar !== ":" &&
        nextTokenChar !== "(" &&
        fullLiteral.length >= 4 &&
        fullLiteral.length <= 160
      ) {
        try {
          const parsedStr = JSON.parse(
            quote === '"'
              ? fullLiteral
              : '"' + rawContent.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"'
          );
          let strIdx = stringIndexMap.get(parsedStr);
          if (strIdx === undefined) {
            const bytes = Buffer.from(parsedStr, "utf-8");
            const xored = Buffer.allocUnsafe(bytes.length);
            for (let b = 0; b < bytes.length; b++) {
              xored[b] = bytes[b] ^ XOR_STRING_KEY;
            }
            strIdx = stringTable.length;
            stringTable.push(xored.toString("base64"));
            stringIndexMap.set(parsedStr, strIdx);
          }
          out += `${decoderIdent}(0x${strIdx.toString(16)})`;
          continue;
        } catch {
          // Fallback to literal if string escape is non-standard
        }
      }

      out += fullLiteral;
      continue;
    }

    // 4. Template literal (`...`)
    if (ch === "`") {
      out += ch;
      i++;
      while (i < len && code[i] !== "`") {
        if (code[i] === "\\") {
          out += code[i] + (code[i + 1] || "");
          i += 2;
        } else {
          out += code[i];
          i++;
        }
      }
      if (i < len) {
        out += code[i];
        i++;
      }
      continue;
    }

    // 5. Regex literal (/.../flags)
    if (ch === "/" && isRegexBefore(out, out.length)) {
      let start = i;
      i++;
      let inCharClass = false;
      let validRegex = true;
      while (i < len) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === "[") inCharClass = true;
        else if (code[i] === "]") inCharClass = false;
        else if (code[i] === "/" && !inCharClass) {
          i++;
          while (i < len && /[dgimsuvy]/.test(code[i])) i++;
          break;
        } else if (code[i] === "\n" || code[i] === "\r") {
          validRegex = false;
          break;
        }
        i++;
      }
      if (validRegex) {
        out += code.slice(start, i);
        continue;
      } else {
        i = start + 1;
        out += "/";
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Minifies JavaScript code by stripping comments and collapsing redundant whitespace/lines
 */
export function minifyJsChunk(code) {
  const commentStripped = scanAndTransformJs(code, { encodeStrings: false });
  const lines = commentStripped
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.join("\n");
}

/**
 * Heavily obfuscates the VM chunk (lupis.vm.js):
 * - Extracts strings into an XOR+Base64 encoded String Array (_0xS)
 * - Injects a fast memoized runtime string decoder (_0xD)
 * - Strips comments and compacts code
 */
export function obfuscateVmChunk(code) {
  const stringTable = [];
  const stringIndexMap = new Map();
  const decoderIdent = "_0xD";

  const transformed = scanAndTransformJs(code, {
    encodeStrings: true,
    stringTable,
    stringIndexMap,
    decoderIdent
  });

  const compactBody = transformed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const header = [
    `const _0xS=${JSON.stringify(stringTable)};`,
    `const _0xC=new Map();`,
    `function ${decoderIdent}(_0xI){`,
    `if(_0xC.has(_0xI))return _0xC.get(_0xI);`,
    `const _0xB=atob(_0xS[_0xI]||"");`,
    `const _0xU=new Uint8Array(_0xB.length);`,
    `for(let _0xK=0;_0xK<_0xB.length;_0xK++)_0xU[_0xK]=_0xB.charCodeAt(_0xK)^0x5a;`,
    `const _0xV=new TextDecoder("utf-8").decode(_0xU);`,
    `_0xC.set(_0xI,_0xV);`,
    `return _0xV;`,
    `}`
  ].join("");

  const candidate = `(function(){${header}\n${compactBody}\n})();`;
  try {
    new vm.Script(candidate);
    return candidate;
  } catch {
    // Fallback to safe minified chunk if any edge-case syntax occurred
    return `(function(){\n${minifyJsChunk(code)}\n})();`;
  }
}

/**
 * Generates the standalone bootstrapper code appended to lupis.loader.js
 */
export function createStandaloneBootCode(runtimeModuleId, mode) {
  const isRelease = mode === "release";
  return `
// === Standalone Bootstrapper ===
(function() {
  globalThis.__LUPIS_BUILD_MODE__ = ${JSON.stringify(mode)};
  globalThis.__LUPIS_ENV__ = {
    DEV: ${!isRelease},
    MODE: ${JSON.stringify(isRelease ? "production" : "development")}
  };
  ${isRelease ? 'if (typeof console !== "undefined" && typeof console.debug === "function") { console.debug = function(){}; }' : ""}

  const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };
  function __lupisRequire(id) {
    if (__reg.c[id]) return __reg.c[id].exports;
    const factory = __reg.m[id];
    if (!factory) {
      throw new Error("Module not found in Lupis registry: " + id);
    }
    const mod = __reg.c[id] = { id, exports: {} };
    Object.defineProperty(mod.exports, "__esModule", { value: true });
    factory(__lupisRequire, mod.exports, mod);
    return mod.exports;
  }
  __reg.r = __lupisRequire;

  function bootStandaloneGame() {
    const runtimeMod = __lupisRequire(${JSON.stringify(runtimeModuleId)});
    const startEngine = runtimeMod.startEngine || (runtimeMod.default && runtimeMod.default.startEngine);
    globalThis.LupisEngine = { startEngine, require: __lupisRequire };

    const loadingEl = document.getElementById("loading");
    const loadingProgressEl = document.getElementById("loading-progress");
    const loadingPercentEl = document.getElementById("loading-percent");
    const canvasEl = document.getElementById("lp_canvas_preview");
    if (!canvasEl || typeof startEngine !== "function") return;

    let windowState = { isMaximized: false, isFullScreen: false };
    if (window.electronAPI && typeof window.electronAPI.onWindowStateChange === "function") {
      window.electronAPI.onWindowStateChange((state) => {
        windowState = state || { isMaximized: false, isFullScreen: false };
        if (canvasEl && canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
      });
    }
    if (window.electronAPI && typeof window.electronAPI.getWindowState === "function") {
      window.electronAPI.getWindowState().then((state) => {
        if (state) {
          windowState = state;
          if (canvasEl && canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
        }
      }).catch(() => {});
    }

    function setupCanvasResponsiveness(refWidth, refHeight) {
      const targetW = Number(refWidth) || 1920;
      const targetH = Number(refHeight) || 1080;
      canvasEl.width = targetW;
      canvasEl.height = targetH;
      const targetRatio = targetW / targetH;

      const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI);

      if (isElectron && typeof window.electronAPI.setAspectRatio === "function") {
        window.electronAPI.setAspectRatio(targetW, targetH);
      }

      const onResize = () => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        if (!winW || !winH) return;

        const isFullscreen = Boolean(
          document.fullscreenElement ||
          windowState.isFullScreen ||
          (window.innerWidth >= screen.width && window.innerHeight >= screen.height)
        );
        const isMaximized = Boolean(windowState.isMaximized);

        // Desktop App (Electron):
        // In normal windowed mode: ALWAYS fill 100% of the window viewport.
        // Proportional aspect ratio is enforced directly on the Electron window frame,
        // eliminating any margin, padding, or black gaps outside the canvas.
        if (isElectron && !isFullscreen && !isMaximized) {
          canvasEl.style.width = "100%";
          canvasEl.style.height = "100%";
          return;
        }

        // Web Standalone (and maximized/fullscreen Desktop App):
        // Always preserve aspect ratio with clean letterboxing/pillarboxing (black bars)
        // so the canvas never becomes stretched or elongated (lonjong).
        const winRatio = winW / winH;
        let finalW, finalH;
        if (winRatio > targetRatio) {
          finalH = winH;
          finalW = finalH * targetRatio;
        } else {
          finalW = winW;
          finalH = finalW / targetRatio;
        }
        canvasEl.style.width = Math.round(finalW) + "px";
        canvasEl.style.height = Math.round(finalH) + "px";
      };

      if (!canvasEl._hasResizeListener) {
        window.addEventListener("resize", () => {
          if (canvasEl._currentResizeHandler) canvasEl._currentResizeHandler();
        });
        canvasEl._hasResizeListener = true;
      }
      canvasEl._currentResizeHandler = onResize;
      onResize();
    }

    async function initStandalone() {
      try {
        if (loadingEl) loadingEl.classList.remove("hidden");
        if (loadingProgressEl) loadingProgressEl.style.width = "0%";
        if (loadingPercentEl) loadingPercentEl.innerText = "0%";

        let initialWidth = (globalThis.__LUPIS_CANVAS_CONFIG__ && globalThis.__LUPIS_CANVAS_CONFIG__.width) || 1920;
        let initialHeight = (globalThis.__LUPIS_CANVAS_CONFIG__ && globalThis.__LUPIS_CANVAS_CONFIG__.height) || 1080;

        if (!globalThis.__LUPIS_CANVAS_CONFIG__) {
          try {
            const resp = await fetch("./build-info.json");
            if (resp.ok) {
              const info = await resp.json();
              if (info && info.canvasWidth && info.canvasHeight) {
                initialWidth = Number(info.canvasWidth);
                initialHeight = Number(info.canvasHeight);
              }
            }
          } catch {}
        }

        setupCanvasResponsiveness(initialWidth, initialHeight);

        const engineResult = await startEngine(
          canvasEl,
          "./data",
          {},
          "runtime",
          (message, percent) => {
            const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
            if (loadingProgressEl) {
              loadingProgressEl.style.width = clamped + "%";
            }
            if (loadingPercentEl) {
              loadingPercentEl.innerText = clamped + "%";
            }
          }
        );

        if (engineResult && engineResult.game && engineResult.game.world && engineResult.game.world.settings) {
          const ui = engineResult.game.world.settings.ui;
          if (ui && ui.width && ui.height && (Number(ui.width) !== canvasEl.width || Number(ui.height) !== canvasEl.height)) {
            setupCanvasResponsiveness(Number(ui.width), Number(ui.height));
          }
        }

        if (loadingProgressEl) loadingProgressEl.style.width = "100%";
        if (loadingPercentEl) loadingPercentEl.innerText = "100%";
        if (loadingEl) loadingEl.classList.add("hidden");
        canvasEl.focus();
      } catch (error) {
        console.error("[Standalone] Error starting game:", error);
        if (loadingEl) {
          loadingEl.classList.remove("hidden");
          const spinner = loadingEl.querySelector(".spinner");
          if (spinner) spinner.style.display = "none";
          const barWrapper = loadingEl.querySelector(".loading-bar-wrapper");
          if (barWrapper) barWrapper.style.display = "none";
          if (loadingPercentEl) loadingPercentEl.style.display = "none";
          let errorEl = document.getElementById("loading-error");
          if (!errorEl) {
            errorEl = document.createElement("div");
            errorEl.id = "loading-error";
            loadingEl.appendChild(errorEl);
          }
          errorEl.innerHTML =
            '<div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 8px;">Game Launch Failed</div>' +
            '<div style="color: #94a3b8; font-size: 12px; max-width: 480px; word-break: break-word;">' +
            (error && error.message ? error.message : String(error)) +
            "</div>";
        }
      }
    }

    initStandalone();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootStandaloneGame);
    } else {
      bootStandaloneGame();
    }
  }
})();
`;
}

/**
 * Generates the standalone index.html shell that loads the 4 modular JS chunks
 */
export function generateStandaloneIndexHtml(gameTitle = "Lupis Engine Game", mode = "release", canvasWidth = 1920, canvasHeight = 1080) {
  const safeTitle = String(gameTitle || "Lupis Engine Game")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const modeBadge = mode === "development"
    ? `\n  <!-- Lupis Engine Standalone Web Build (Mode: DEVELOPMENT) -->`
    : "";

  const safeWidth = Number(canvasWidth) || 1920;
  const safeHeight = Number(canvasHeight) || 1080;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="assets/logo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${safeTitle}</title>${modeBadge}
  <script>
    globalThis.__LUPIS_CANVAS_CONFIG__ = {
      width: ${safeWidth},
      height: ${safeHeight}
    };
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    #canvas_container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #lp_canvas_preview {
      display: block;
      outline: none;
      background: transparent;
      box-shadow: none;
      max-width: 100%;
      max-height: 100%;
    }
    #loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: #0d0f12;
      z-index: 50;
      transition: opacity 0.3s ease;
      padding: 20px;
      text-align: center;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(148, 163, 184, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-bar-wrapper {
      width: 240px;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 12px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
    }
    .loading-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #38bdf8);
      border-radius: 9999px;
      transition: width 0.15s ease-out;
    }
    #loading-percent {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .hidden { opacity: 0 !important; pointer-events: none !important; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-bar-wrapper">
      <div id="loading-progress" class="loading-bar-fill"></div>
    </div>
    <div id="loading-percent">0%</div>
  </div>

  <div id="canvas_container">
    <canvas id="lp_canvas_preview" tabindex="0"></canvas>
  </div>

  <script src="./js/lupis.core.js" defer></script>
  <script src="./js/lupis.renderer.js" defer></script>
  <script src="./js/lupis.vm.js" defer></script>
  <script src="./js/lupis.loader.js" defer></script>
</body>
</html>`;
}

/**
 * Bundles all engine JavaScript modules into the 4 modular chunks:
 * - lupis.loader.js
 * - lupis.core.js
 * - lupis.renderer.js
 * - lupis.vm.js
 *
 * In 'development' mode: readable code + comments + .map Source Maps
 * In 'release' mode: mangled module IDs + minified + heavy obfuscation on lupis.vm.js + no Source Maps
 */
export async function bundleEngineChunks({
  filesToExport,
  engineDir,
  getEngineFileBufferFn,
  mode = "release"
}) {
  const isRelease = mode !== "development";
  const jsFiles = filesToExport
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => f.endsWith(".js"));

  // Map module IDs: in release mode, mangle every module path to _0x0, _0x1, ...
  const moduleIdMap = new Map();
  jsFiles.forEach((relPath, idx) => {
    moduleIdMap.set(relPath, isRelease ? `_0x${idx.toString(16)}` : relPath);
  });

  const mapModuleId = (id) => moduleIdMap.get(id) || id;

  const chunkBuckets = {
    "lupis.core.js": [],
    "lupis.renderer.js": [],
    "lupis.vm.js": [],
    "lupis.loader.js": []
  };

  for (const relPath of jsFiles) {
    const buf = await getEngineFileBufferFn(relPath, engineDir);
    if (!buf) continue;
    const originalCode = buf.toString("utf-8").replace(/\r\n/g, "\n");
    const transformedCode = transformEsmToRegistryModule(originalCode, relPath, mapModuleId);
    const chunkName = classifyEngineChunk(relPath);
    const mappedId = mapModuleId(relPath);

    chunkBuckets[chunkName].push({
      relPath,
      mappedId,
      originalCode,
      transformedCode,
      transformedLines: transformedCode.split("\n").length,
      wrapperHeaderLines: isRelease ? 1 : 2,
      wrapperFooterLines: 1
    });
  }

  const outputFiles = {};

  for (const [chunkName, entries] of Object.entries(chunkBuckets)) {
    const isLoader = chunkName === "lupis.loader.js";
    const isVm = chunkName === "lupis.vm.js";

    const rawSections = [
      `const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };`
    ];

    for (const entry of entries) {
      if (!isRelease) {
        rawSections.push(`// === Module: ${entry.relPath} ===`);
      }
      rawSections.push(
        `__reg.m[${JSON.stringify(entry.mappedId)}] = function(__require, __exports, __module) {\n${entry.transformedCode}\n};`
      );
    }

    if (isLoader) {
      const runtimeId = mapModuleId("Runtime.js");
      rawSections.push(createStandaloneBootCode(runtimeId, isRelease ? "release" : "development"));
    }

    const combinedCode = rawSections.join("\n");

    if (isRelease) {
      let finalCode;
      try {
        const terserRes = await terserMinify(combinedCode, {
          ecma: 2020,
          module: false,
          mangle: {
            toplevel: false,
            keep_classnames: true,
            keep_fnames: true,
            reserved: [
              "__LUPIS_REGISTRY__",
              "__require",
              "__exports",
              "__module",
              "LupisEngine",
              "startEngine",
              "initStandalone",
              "bootStandaloneGame",
              "globalThis",
              "window",
              "document"
            ]
          },
          compress: {
            keep_classnames: true,
            keep_fnames: true,
            passes: 1
          },
          format: {
            comments: false
          }
        });
        const mangledCode = terserRes?.code || combinedCode;
        finalCode = `(function(){\n${mangledCode}\n})();`;
      } catch (err) {
        console.warn(`[Bundler] Terser minification failed for ${chunkName}, using fallback:`, err.message);
        finalCode = `(function(){\n${minifyJsChunk(combinedCode)}\n})();`;
      }

      try {
        new vm.Script(finalCode);
      } catch (scriptErr) {
        console.warn(`[Bundler] Syntax check failed for ${chunkName}, using safe fallback:`, scriptErr.message);
        finalCode = `(function(){\n${combinedCode}\n})();`;
      }

      outputFiles[`js/${chunkName}`] = finalCode;
    } else {
      const mapFileName = `${chunkName}.map`;
      const devWrapped = `(function() {\n${combinedCode}\n})();\n//# sourceMappingURL=${mapFileName}\n`;
      const sourceMapJson = generateSourceMapV3(chunkName, entries, 2);
      outputFiles[`js/${chunkName}`] = devWrapped;
      outputFiles[`js/${mapFileName}`] = sourceMapJson;
    }
  }

  return outputFiles;
}

const memoryRuntimeCache = new Map();
const inFlightBundlePromises = new Map();

/**
 * Computes a fast signature/hash of the engine files to detect any modifications in core/
 */
export function computeEngineHash(filesToExport, engineDir, mode = "release") {
  const hash = crypto.createHash("sha256");
  hash.update(`mode:${mode}\nbundler-version:3\n`);

  const jsFiles = (filesToExport || [])
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => f.endsWith(".js"))
    .sort();

  for (const rel of jsFiles) {
    if (engineDir && fs.existsSync(engineDir)) {
      const full = path.join(engineDir, rel);
      if (fs.existsSync(full)) {
        try {
          const st = fs.statSync(full);
          hash.update(`${rel}:${st.mtimeMs}:${st.size}\n`);
          continue;
        } catch {}
      }
    }
    hash.update(`${rel}:missing\n`);
  }

  return hash.digest("hex").slice(0, 32);
}

/**
 * Clears the in-memory engine runtime chunk cache (useful for testing or cache resets)
 */
export function clearRuntimeMemoryCache() {
  memoryRuntimeCache.clear();
}

/**
 * Retrieves pre-bundled engine runtime chunks from memory/disk cache,
 * or builds them once and saves to cache.
 */
export async function getOrBuildCachedEngineChunks({
  filesToExport,
  engineDir,
  getEngineFileBufferFn,
  mode = "release",
  cacheDir = null,
  forceRebuild = false
}) {
  const normalizedMode = mode === "development" ? "development" : "release";
  const engineHash = computeEngineHash(filesToExport, engineDir, normalizedMode);
  const cacheKey = `${normalizedMode}:${engineHash}`;

  if (!forceRebuild) {
    // 1. In-memory cache check
    if (memoryRuntimeCache.has(cacheKey)) {
      return { ...memoryRuntimeCache.get(cacheKey) };
    }

    // 2. Disk cache check
    if (cacheDir) {
      const diskDir = path.join(cacheDir, "runtime", normalizedMode);
      const metaPath = path.join(diskDir, "meta.json");
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          if (meta.engineHash === engineHash) {
            const chunks = {};
            const files = fs.readdirSync(diskDir);
            for (const f of files) {
              if (f.endsWith(".js") || f.endsWith(".map")) {
                chunks[`js/${f}`] = fs.readFileSync(path.join(diskDir, f), "utf-8");
              }
            }
            if (Object.keys(chunks).length > 0) {
              memoryRuntimeCache.set(cacheKey, chunks);
              return { ...chunks };
            }
          }
        } catch (e) {
          // Ignore disk read error and fallback to build
        }
      }
    }
  }

  // Deduplicate concurrent bundling runs for the same key
  if (inFlightBundlePromises.has(cacheKey)) {
    const res = await inFlightBundlePromises.get(cacheKey);
    return { ...res };
  }

  const bundlePromise = (async () => {
    console.log(`[EngineBundler] Pre-bundling engine runtime chunks for mode: ${normalizedMode.toUpperCase()} (hash: ${engineHash.slice(0, 8)})...`);
    const bundledChunks = await bundleEngineChunks({
      filesToExport,
      engineDir,
      getEngineFileBufferFn,
      mode: normalizedMode
    });

    memoryRuntimeCache.set(cacheKey, bundledChunks);

    if (cacheDir) {
      try {
        const diskDir = path.join(cacheDir, "runtime", normalizedMode);
        fs.mkdirSync(diskDir, { recursive: true });
        for (const [relFile, content] of Object.entries(bundledChunks)) {
          const baseName = path.basename(relFile);
          fs.writeFileSync(path.join(diskDir, baseName), content, "utf-8");
        }
        fs.writeFileSync(
          path.join(diskDir, "meta.json"),
          JSON.stringify({
            engineHash,
            mode: normalizedMode,
            builtAt: new Date().toISOString()
          })
        );
      } catch (err) {
        console.warn("[EngineBundler] Failed to persist runtime cache to disk:", err.message);
      }
    }

    return bundledChunks;
  })();

  inFlightBundlePromises.set(cacheKey, bundlePromise);
  try {
    const result = await bundlePromise;
    return { ...result };
  } finally {
    inFlightBundlePromises.delete(cacheKey);
  }
}

/**
 * Processes extracted project files directly into `outputDir/data` and `outputDir/assets`
 * according to 'development' or 'release' mode.
 */
export async function processProjectDataForExport({
  projectExtractDir,
  outputDir,
  mode = "release",
  obfuscateAndProtectProjectFn,
  packDirectoryToLupisProjectFileFn
}) {
  const normalizedMode = mode === "development" ? "development" : "release";
  const isRelease = normalizedMode === "release";

  const dataDir = path.join(outputDir, "data");
  const assetsOutDir = path.join(outputDir, "assets");

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(assetsOutDir, { recursive: true });

  // Ensure logo.png from editor assets or runner icon
  const runnerIcon = path.resolve(__dirname, "../runner/icon.png");
  const editorLogo = path.resolve(__dirname, "../../editor/public/assets/logo.png");
  const targetLogo = path.join(assetsOutDir, "logo.png");
  if (!fs.existsSync(targetLogo)) {
    if (fs.existsSync(editorLogo)) {
      try { fs.copyFileSync(editorLogo, targetLogo); } catch {}
    } else if (fs.existsSync(runnerIcon)) {
      try { fs.copyFileSync(runnerIcon, targetLogo); } catch {}
    }
  }

  // Read game title and canvas resolution from project.json before packing
  let gameTitle = "Lupis Engine Game";
  let canvasWidth = 1920;
  let canvasHeight = 1080;
  try {
    const projectJsonPath = path.join(projectExtractDir, "project.json");
    if (fs.existsSync(projectJsonPath)) {
      const pData = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
      if (pData && pData.name) gameTitle = pData.name;
      const uiSettings = pData?.settings?.ui;
      if (uiSettings?.width && !isNaN(Number(uiSettings.width)) && Number(uiSettings.width) > 0) {
        canvasWidth = Number(uiSettings.width);
      }
      if (uiSettings?.height && !isNaN(Number(uiSettings.height)) && Number(uiSettings.height) > 0) {
        canvasHeight = Number(uiSettings.height);
      }
    }
  } catch (err) {
    console.warn("[Bundler] Failed to parse project.json for canvas dimensions:", err);
  }

  const srcAssetsDir = path.join(projectExtractDir, "assets");

  if (isRelease) {
    // Obfuscate scripts, convert assets to .lupisdata, strip editor metadata
    if (typeof obfuscateAndProtectProjectFn === "function") {
      await obfuscateAndProtectProjectFn(projectExtractDir);
    }

    // Move .lupisdata files into outputDir/assets/
    if (fs.existsSync(srcAssetsDir)) {
      for (const file of fs.readdirSync(srcAssetsDir)) {
        const srcFile = path.join(srcAssetsDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, path.join(assetsOutDir, file));
        }
      }
      fs.rmSync(srcAssetsDir, { recursive: true, force: true });
    }

    // Pack obfuscated project JSON structure into single encrypted binary: data/game.data
    const gameDataPath = path.join(dataDir, "game.data");
    if (typeof packDirectoryToLupisProjectFileFn === "function") {
      await packDirectoryToLupisProjectFileFn(projectExtractDir, gameDataPath);
    }
  } else {
    // Development mode: keep OPFS structure open in data/ and raw assets in assets/
    const assetsJsonPath = path.join(projectExtractDir, "workspaces", "assets.json");
    if (fs.existsSync(assetsJsonPath)) {
      try {
        const assetsRaw = JSON.parse(fs.readFileSync(assetsJsonPath, "utf-8"));
        const assetsList = Array.isArray(assetsRaw) ? assetsRaw : (assetsRaw?.items || []);
        for (const asset of assetsList) {
          if (!asset) continue;
          delete asset.localBlob;
          asset.fileUrl = "";
          if (asset.meta) {
            asset.meta.protected = false;
          }
        }
        fs.writeFileSync(assetsJsonPath, JSON.stringify(assetsList, null, 2), "utf-8");
      } catch {}
    }

    if (fs.existsSync(srcAssetsDir)) {
      for (const file of fs.readdirSync(srcAssetsDir)) {
        const srcFile = path.join(srcAssetsDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, path.join(assetsOutDir, file));
        }
      }
      fs.rmSync(srcAssetsDir, { recursive: true, force: true });
    }

    // Copy remaining OPFS structure (project.json, scenes/, prefabs/, scripts/, workspaces/) into data/
    for (const entry of fs.readdirSync(projectExtractDir)) {
      const srcEntry = path.join(projectExtractDir, entry);
      const destEntry = path.join(dataDir, entry);
      fs.cpSync(srcEntry, destEntry, { recursive: true });
    }
  }

  return { gameTitle, canvasWidth, canvasHeight };
}

/**
 * Builds the complete Unified Web Package into `outputDir` for both
 * Standalone Web (.ZIP) and Electron Desktop (.EXE) in 'development' or 'release' mode.
 *
 * Uses cached pre-bundled engine chunks when available to eliminate redundant Terser minification.
 */
export async function buildUnifiedWebPackage({
  projectExtractDir,
  outputDir,
  mode = "release",
  filesToExport,
  engineDir,
  getEngineFileBufferFn,
  obfuscateAndProtectProjectFn,
  packDirectoryToLupisProjectFileFn,
  cacheDir = null,
  cachedChunks = null
}) {
  const normalizedMode = mode === "development" ? "development" : "release";

  const jsDir = path.join(outputDir, "js");
  fs.mkdirSync(jsDir, { recursive: true });

  // 1. Obtain engine runtime chunks (from memory/disk cache, or pre-bundle)
  const chunks = cachedChunks || (await getOrBuildCachedEngineChunks({
    filesToExport,
    engineDir,
    getEngineFileBufferFn,
    mode: normalizedMode,
    cacheDir
  }));

  for (const [relFile, content] of Object.entries(chunks)) {
    const targetPath = path.join(outputDir, relFile);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, "utf-8");
  }

  // 2. Process project data & assets directly into outputDir
  const { gameTitle, canvasWidth, canvasHeight } = await processProjectDataForExport({
    projectExtractDir,
    outputDir,
    mode: normalizedMode,
    obfuscateAndProtectProjectFn,
    packDirectoryToLupisProjectFileFn
  });

  // 3. Generate index.html shell
  const indexHtml = generateStandaloneIndexHtml(gameTitle, normalizedMode, canvasWidth, canvasHeight);
  fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml, "utf-8");

  fs.writeFileSync(
    path.join(outputDir, "build-info.json"),
    JSON.stringify({
      gameTitle,
      canvasWidth,
      canvasHeight,
      mode: normalizedMode,
      builtAt: new Date().toISOString()
    }, null, 2),
    "utf-8"
  );

  return {
    mode: normalizedMode,
    gameTitle,
    canvasWidth,
    canvasHeight,
    outputDir
  };
}

