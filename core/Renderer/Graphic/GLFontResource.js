import OPFSHelper from "../../Util/opfsHelper.js";
import LupisPackageHelper from "../../Util/LupisPackageHelper.js";

export default class GLFontResource {
  constructor(gl) {
    this.gl = gl;
  }

  async _getOpfsFontFile(projectId, fileName, isText = false) {
    if (isText) {
      return await OPFSHelper.readAsText(projectId, fileName);
    }
    return await OPFSHelper.createBlobUrl(projectId, fileName);
  }

  async loadFontFromAsset(asset, opfsConfig, isSystemDefault = false) {
    let xmlText = '';
    let textureBlobUrl = null;
    let xmlUrl = '';
    let texUrl = '';

    try {
      if (isSystemDefault) {
        xmlUrl = asset.fileUrl;
        texUrl = asset.meta?.textureUrl;

        const [xmlRes, img] = await Promise.all([
          fetch(xmlUrl),
          this._loadImage(texUrl)
        ]);
        if (!xmlRes.ok) throw new Error(`Failed to fetch XML: ${xmlUrl}`);
        xmlText = await xmlRes.text();

        const fontData = this._parseFontXML(xmlText);
        const glTexture = this._uploadFontTexture(img);

        return {
          id: asset.id,
          fileurl: xmlUrl,
          textureurl: texUrl,
          glTexture: glTexture,
          chars: fontData.chars,
          common: fontData.common,
          info: fontData.info,
          ready: true
        };
      }

      if (asset.fileKey) {
        const xmlFileName = `${asset.fileKey}.fnt`;
        const texFileName = `${asset.fileKey}.png`;
        const protectedXmlName = asset.meta?.fntLupisData || `${asset.fileKey}_fnt.lupisdata`;
        const protectedTexName = asset.meta?.texLupisData || `${asset.fileKey}_tex.lupisdata`;

        if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId) {
          const [fetchedXmlText, blobUrl] = await Promise.all([
            this._getOpfsFontFile(opfsConfig.projectId, xmlFileName, true),
            this._getOpfsFontFile(opfsConfig.projectId, texFileName, false)
          ]);

          xmlText = fetchedXmlText;
          textureBlobUrl = blobUrl;
          xmlUrl = xmlFileName;
          texUrl = texFileName;

          const img = await this._loadImage(textureBlobUrl);
          const fontData = this._parseFontXML(xmlText);
          const glTexture = this._uploadFontTexture(img);

          return {
            id: asset.id,
            fileurl: xmlUrl,
            textureurl: texUrl,
            glTexture: glTexture,
            chars: fontData.chars,
            common: fontData.common,
            info: fontData.info,
            ready: true
          };
        } 
        else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
          const cleanBaseURL = opfsConfig.replace(/\/$/, "");
          const isProtected = Boolean(asset.meta?.protected || asset.meta?.fntLupisData || asset.meta?.texLupisData);

          if (!isProtected && asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/'))) {
            xmlUrl = asset.fileUrl;
            texUrl = asset.meta?.textureUrl || `${cleanBaseURL}/assets/${texFileName}`;
          } else {
            xmlUrl = `${cleanBaseURL}/assets/${isProtected ? protectedXmlName : xmlFileName}`;
            texUrl = `${cleanBaseURL}/assets/${isProtected ? protectedTexName : texFileName}`;
          }

          try {
            const [fetchedText, decodedTexBlobUrl] = await Promise.all([
              LupisPackageHelper.fetchText(xmlUrl),
              LupisPackageHelper.createDecodedBlobUrl(texUrl, 'image/png')
            ]);
            xmlText = fetchedText;
            textureBlobUrl = decodedTexBlobUrl;
          } catch {
            const fallbackXmlUrl = `${cleanBaseURL}/assets/${protectedXmlName}`;
            const fallbackTexUrl = `${cleanBaseURL}/assets/${protectedTexName}`;
            const [fetchedText, decodedTexBlobUrl] = await Promise.all([
              LupisPackageHelper.fetchText(fallbackXmlUrl),
              LupisPackageHelper.createDecodedBlobUrl(fallbackTexUrl, 'image/png')
            ]);
            xmlText = fetchedText;
            textureBlobUrl = decodedTexBlobUrl;
          }

          const img = await this._loadImage(textureBlobUrl);
          const fontData = this._parseFontXML(xmlText);
          const glTexture = this._uploadFontTexture(img);

          return {
            id: asset.id,
            fileurl: xmlUrl,
            textureurl: texUrl,
            glTexture: glTexture,
            chars: fontData.chars,
            common: fontData.common,
            info: fontData.info,
            ready: true
          };
        } 
        else {
          xmlUrl = asset.fileUrl || xmlFileName;
          texUrl = asset.meta?.textureUrl || texFileName;
        }
      } else {
        xmlUrl = asset.fileUrl || '';
        texUrl = asset.meta?.textureUrl || '';
      }

      const [fetchedText, decodedTexBlobUrl] = await Promise.all([
        LupisPackageHelper.fetchText(xmlUrl),
        texUrl.startsWith('blob:') || texUrl.startsWith('data:')
          ? Promise.resolve(texUrl)
          : LupisPackageHelper.createDecodedBlobUrl(texUrl, 'image/png')
      ]);

      xmlText = fetchedText;
      if (decodedTexBlobUrl !== texUrl) {
        textureBlobUrl = decodedTexBlobUrl;
      }

      const img = await this._loadImage(decodedTexBlobUrl);
      const fontData = this._parseFontXML(xmlText);
      const glTexture = this._uploadFontTexture(img);

      return {
        id: asset.id,
        fileurl: xmlUrl,
        textureurl: texUrl,
        glTexture: glTexture,
        chars: fontData.chars,
        common: fontData.common,
        info: fontData.info,
        ready: true
      };

    } finally {
      if (textureBlobUrl) {
        URL.revokeObjectURL(textureBlobUrl);
      }
    }
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load font image: ${url}`));
      img.src = url;
    });
  }

  _uploadFontTexture(img) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  _parseFontXML(xmlStr) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, "application/xml");

    const chars = {};
    xml.querySelectorAll("char").forEach(c => {
      chars[c.getAttribute("id")] = {
        x: +c.getAttribute("x"), y: +c.getAttribute("y"),
        w: +c.getAttribute("width"), h: +c.getAttribute("height"),
        ox: +c.getAttribute("xoffset"), oy: +c.getAttribute("yoffset"),
        adv: +c.getAttribute("xadvance")
      };
    });

    const commonNode = xml.querySelector("common");
    const infoNode = xml.querySelector("info");
    const distNode = xml.querySelector("distanceField");
    const lineHeight = +commonNode.getAttribute("lineHeight");

    let stdYMin = Infinity;
    let stdYMax = -Infinity;
    const refString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < refString.length; i++) {
      const gdat = chars[refString.charCodeAt(i)];
      if (!gdat) continue;

      const y0 = gdat.oy;
      const y1 = gdat.oy + gdat.h;

      if (y0 < stdYMin) stdYMin = y0;
      if (y1 > stdYMax) stdYMax = y1;
    }

    if (stdYMin === Infinity) {
      stdYMin = 0;
      stdYMax = lineHeight;
    }

    return {
      chars,
      common: {
        texW: +commonNode.getAttribute("scaleW"),
        texH: +commonNode.getAttribute("scaleH"),
        base: +commonNode.getAttribute("base"),
        lineHeight: lineHeight,
        stdYMin: stdYMin,
        stdYMax: stdYMax,
        stdHeight: stdYMax - stdYMin,
        stdCenterY: (stdYMin + stdYMax) / 2
      },
      info: {
        size: Math.abs(+infoNode.getAttribute("size")),
        distanceRange: distNode ? +distNode.getAttribute("distanceRange") : 4
      }
    };
  }
}
