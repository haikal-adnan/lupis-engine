export default class GLFontResource {
    constructor(gl) {
        this.gl = gl;
    }

    async loadFontFromAsset(asset, baseURL, isSystemDefault = false) {
        let xmlUrl, texUrl;

        if (isSystemDefault) {
            xmlUrl = asset.fileUrl;
            texUrl = asset.meta?.textureUrl;
        } else {
             xmlUrl = `${baseURL}${asset.fileKey}.fnt`;
             texUrl = `${baseURL}${asset.fileKey}.png`;
        }

        if (!texUrl) throw new Error(`[GLFontResource] Texture URL missing for: ${asset.name}`);

        const [xmlRes, img] = await Promise.all([
            fetch(xmlUrl),
            this._loadImage(texUrl)
        ]);

        if (!xmlRes.ok) throw new Error(`[GLFontResource] Failed to fetch XML: ${xmlUrl}`);
        
        const xmlText = await xmlRes.text();
        const fontData = this._parseFontXML(xmlText);

        const glTexture = this._uploadFontTexture(img, this.gl.LINEAR);

        return {
            _id: asset._id,
            fileurl: xmlUrl,
            textureurl: texUrl,
            glTexture: glTexture,
            chars: fontData.chars,
            common: fontData.common,
            info: fontData.info,
            ready: true
        };
    }

    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load font image: ${url}`));
            img.src = url;
        });
    }

    _uploadFontTexture(img, filterMode) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
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

        return {
            chars,
            common: {
                texW: +commonNode.getAttribute("scaleW"),
                texH: +commonNode.getAttribute("scaleH"),
                base: +commonNode.getAttribute("base"),
                lineHeight: +commonNode.getAttribute("lineHeight")
            },
            info: {
                size: +infoNode.getAttribute("size"),
                distance: +(distNode?.getAttribute("distanceRange") ?? 4) 
            }
        };
    }
}