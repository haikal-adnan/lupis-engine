import crypto from "crypto";
import Folder from "../models/nosql/Folder.js";

export const createFolder = async ({ folderId, projectId, name, parentId = null }) => {
  try {
    const id = folderId || crypto.randomUUID();

    const newFolder = new Folder({
      _id: id,
      projectId,
      name,
      parentId
    });

    await newFolder.save();
    return newFolder;
  } catch (error) {
    console.error("[DB Error] Gagal membuat data folder:", error);
    throw error;
  }
};