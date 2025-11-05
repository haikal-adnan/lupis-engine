// preview.js
import { startEngine } from "/engine/main.js";
import initEngine from "../../../projects/template-platformer/code/Main.js";

const project = new URLSearchParams(location.search).get("project") || "default";
const gl = document.getElementById("glPreviewCanvas");
const ui = document.getElementById("uiPreviewCanvas");
const loading = document.getElementById("loading");

async function boot() {
  try {
    console.log(`🚀 Starting Lupis Engine preview for project: ${project}`);

    // Inisialisasi engine secara global (memastikan module utama ter-load)
    await initEngine({
      project,
      glCanvas: gl,
      uiCanvas: ui,
    });

    // Jalankan loop utama engine
    await startEngine("glPreviewCanvas", "uiPreviewCanvas");

    // Hilangkan teks "Loading"
    loading.remove();

    console.log("✅ Engine started successfully.");
  } catch (err) {
    loading.textContent = "❌ Failed to start engine";
    console.error("Engine start failed:", err);
  }
}

boot();

// --- Integrasi dengan Visual Editor (opsional) ---
window.addEventListener("message", async (e) => {
  if (e.data?.type === "reloadGame") {
    console.log("♻ Reload game from editor");
    loading.textContent = "Reloading...";
    try {
      await startEngine("glPreviewCanvas", "uiPreviewCanvas");
      loading.remove();
    } catch (err) {
      loading.textContent = "❌ Reload failed";
      console.error(err);
    }
  }
});
