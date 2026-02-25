import crypto from "crypto";
import Asset from "../models/nosql/Asset.js"; 

export const createAsset = async ({
  projectId,
  folderId = null,
  name,
  type,
  fileKey,
  extension,
  size,
  dimensions
}) => {
  try {
    const assetId = crypto.randomUUID();

    const newAsset = new Asset({
      _id: assetId,
      projectId,
      folderId,
      name,
      type,
      fileKey, 
      meta: {
        extension,
        size,
        dimensions,
        filterMode: type === 'texture' ? 'nearest' : 'linear' 
      }
    });

    await newAsset.save();
    return newAsset;
  } catch (error) {
    console.error("[DB Error] Gagal membuat data asset:", error);
    throw error;
  }
};