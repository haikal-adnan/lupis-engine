import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Layani semua file statis di folder ini
app.use(express.static(__dirname, { extensions: ["html", "js"] }));

// Rute utama (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Lupis Engine running at http://localhost:${PORT}`);
});
