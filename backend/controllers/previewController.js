import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const previewController = {
  async startPreview(req, res) {
    const { project } = req.body;
    if (!project) return res.status(400).json({ error: "Missing project" });

    console.log(`🟢 Preview request for project: ${project}`);

    // Validasi folder project
    const projectPath = path.resolve(__dirname, `../../projects/${project}`);
    if (!fs.existsSync(projectPath))
      return res.status(404).json({ error: "Project not found" });

    // Simpan state sementara (opsional)
    return res.json({ url: `/preview/${project}` });
  },

  async servePreview(req, res) {
    const { project } = req.params;
    const htmlPath = path.resolve(__dirname, "../public/preview.html");

    // Layani file HTML yang menjalankan engine
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Sisipkan project ke dalam HTML (agar runtime tahu project apa yang dimuat)
    html = html.replace("{{PROJECT_ID}}", project);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  },
};
