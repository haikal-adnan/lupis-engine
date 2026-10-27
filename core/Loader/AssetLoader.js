import { DEFAULT_FONT_XML, DEFAULT_FONT_TEXTURE_B64 } from "../Assets/Fonts/defaultFont.js";
import { DEFAULT_SYSTEM_FONT_ASSET } from "../Schema/defaultAsset.js";
import Config from "../Core/Config.js";

export default class AssetLoader {
  constructor(imageResource, fontResource, audioResource) {
    this.imageResource = imageResource;
    this.fontResource = fontResource;
    this.audioResource = audioResource;
    this._isSystemDefaultLoaded = false;
  }

  async loadAsset(world, assets = [], baseURL, onProgress) {
    if (!this._isSystemDefaultLoaded) {
      await this._loadSystemDefault(world);
      this._isSystemDefaultLoaded = true;
    }

    if (!world.audios) world.audios = {};
    if (!world.assetMap) world.assetMap = {};
    world.assetList = Array.isArray(assets) ? assets : [];
    for (const a of world.assetList) {
      if (a && a.id) {
        world.assetMap[a.id] = a;
        if (a.scriptId) world.assetMap[a.scriptId] = a;
      }
    }

    const totalAssets = assets.length;
    let loadedAssets = 0;

    if (totalAssets === 0) {
      if (onProgress) onProgress("All assets ready...", 100);
      return;
    }

    const loadPromises = assets.map(async (asset) => {
      try {
        switch (asset.type) {
          case "texture":
            await this.loadTexture(world, asset, baseURL);
            break;
          case "font":
            await this.loadFont(world, asset, baseURL);
            break;
          case "audio":
            if (Config.ENGINE_MODE !== "editor") {
              await this.loadAudio(world, asset, baseURL);
            }
            break;
        }
      } catch (err) {
        console.error(`[AssetLoader] Failed to load asset [${asset.id}]: ${asset.scriptId || asset.id}`, err);
      } finally {
        loadedAssets++;
        if (onProgress) {
          const percentage = Math.floor((loadedAssets / totalAssets) * 100);
          onProgress("Loading assets...", percentage);
        }
      }
    });

    await Promise.all(loadPromises);
  }

  async _loadSystemDefault(world) {
    try {
      const blob = new Blob([DEFAULT_FONT_XML], { type: "application/xml" });
      const xmlUrl = URL.createObjectURL(blob);

      const defaultAsset = {
        ...DEFAULT_SYSTEM_FONT_ASSET,
        fileUrl: xmlUrl,
        meta: {
          ...DEFAULT_SYSTEM_FONT_ASSET.meta,
          textureUrl: DEFAULT_FONT_TEXTURE_B64
        }
      };

      const fontResult = await this.fontResource.loadFontFromAsset(defaultAsset, null, true);
      world.addFont(defaultAsset.id, fontResult);

      URL.revokeObjectURL(xmlUrl);
    } catch (e) {
      console.error("[AssetLoader] CRITICAL: Failed to load System Default Font.", e);
    }
  }

  async loadTexture(world, asset, baseURL) {
    const textureData = await this.imageResource.loadTextureFromAsset(asset, baseURL);
    if (!textureData) return;

    const data = {
      id: asset.id,
      glTexture: textureData.glTexture,
      fileurl: textureData.src,
      width: textureData.width,
      height: textureData.height
    };

    world.addTexture(asset.id, data);
    if (asset.scriptId && asset.scriptId !== asset.id) {
      world.addTexture(asset.scriptId, data);
    }
  }

  async loadFont(world, asset, baseURL) {
    const fontResult = await this.fontResource.loadFontFromAsset(asset, baseURL);
    if (fontResult) {
      world.addFont(asset.id, fontResult);
      if (asset.scriptId && asset.scriptId !== asset.id) {
        world.addFont(asset.scriptId, fontResult);
      }
    }
  }

  async loadAudio(world, asset, baseURL) {
    const audioData = await this.audioResource.loadAudioFromAsset(asset, baseURL);
    if (audioData && audioData.buffer) {
      world.audios[asset.id] = audioData.buffer;
    }
  }
}