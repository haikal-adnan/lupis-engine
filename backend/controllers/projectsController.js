import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mime from "mime-types";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsDir = process.env.PROJECTS_PATH || path.resolve("/home/ubuntu/lupis/projects");

// Fungsi rekursif buat tree
function buildTree(dir) {
  const items = fs.readdirSync(dir);
  return items.map(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      return { name: item, type: "folder", children: buildTree(fullPath) };
    } else {
      return { name: item, type: "file" };
    }
  });
}

export const getAllProjects = (req, res) => {
  const dirs = fs.readdirSync(projectsDir).filter(d =>
    fs.lstatSync(path.join(projectsDir, d)).isDirectory()
  );
  const projects = dirs.map(name => ({
    id: name,
    name,
    path: `/projects/${name}`
  }));
  res.json(projects);
};

export const getProjectDetail = (req, res) => {
  const projectName = req.params.id;
  const projectPath = path.join(projectsDir, projectName);
  const metaPath = path.join(projectPath, "meta.json");

  if (!fs.existsSync(projectPath))
    return res.status(404).json({ error: "Project not found" });

  let meta = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  }

  res.json({ name: projectName, meta });
};

// 🗂️ Endpoint pohon folder
export const getProjectTree = (req, res) => {
  const projectName = req.params.id;
  const projectPath = path.join(projectsDir, projectName);

  if (!fs.existsSync(projectPath))
    return res.status(404).json({ error: "Project not found" });

  const tree = buildTree(projectPath);
  res.json(tree);
};

export const getProjectFileRegex = (req, res) => {
  // Dari regex: ^\/([^/]+)\/file\/(.+)$
  const projectName = req.params[0];     // grup 1 → id project
  const filePathInProject = req.params[1]; // grup 2 → path file di dalam project

  const projectRoot = path.join(projectsDir, projectName);
  const fullPath = path.join(projectRoot, filePathInProject);

  // 🔒 Guard traversal
  const safeRoot = path.resolve(projectRoot);
  const safeTarget = path.resolve(fullPath);
  if (!safeTarget.startsWith(safeRoot + path.sep) && safeTarget !== safeRoot) {
    return res.status(400).json({ error: "Invalid path" });
  }

  if (!fs.existsSync(safeTarget)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(safeTarget);
  if (stat.isDirectory()) {
    return res.status(400).json({ error: "Cannot read a folder" });
  }

  const mimeType = mime.lookup(safeTarget) || "application/octet-stream";
  res.setHeader("Content-Type", mimeType);

  const stream = fs.createReadStream(safeTarget);
  stream.on("error", (err) => {
    console.error("Stream error:", err);
    res.status(500).json({ error: "Failed to read file" });
  });
  stream.pipe(res);
};