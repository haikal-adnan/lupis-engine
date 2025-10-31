import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve("/home/ubuntu/lupis/projects");

export const getAssets = (req, res) => {
  const projectId = req.params.projectId;
  const projectPath = path.join(baseDir, projectId, "assets");

  if (!fs.existsSync(projectPath)) return res.status(404).json({ error: "Assets not found" });

  function buildTree(dir) {
    const items = fs.readdirSync(dir);
    return items.map(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.lstatSync(fullPath);
      if (stat.isDirectory()) {
        return { name: item, type: "folder", children: buildTree(fullPath) };
      } else {
        return { name: item, type: "file" };
      }
    });
  }

  const tree = buildTree(projectPath);
  res.json(tree);
};
