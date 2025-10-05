import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// PIN rahasia (bisa kamu ambil dari process.env.ACCESS_PIN)
const ACCESS_PIN = "2533";

// Middleware untuk parsing cookie
app.use(cookieParser());

// Middleware verifikasi PIN
app.use((req, res, next) => {
  // Jika sudah punya cookie, lanjutkan
  if (req.cookies.access === "granted") return next();

  // Jika user memasukkan PIN via query (atau header)
  const pin = req.query.pin || req.headers["x-access-pin"];
  if (pin === ACCESS_PIN) {
    // Set cookie agar user tidak perlu input PIN lagi
    res.cookie("access", "granted", { maxAge: 3600000, httpOnly: true }); // 1 jam
    return res.redirect("/");
  }

  // Jika belum ada cookie & PIN salah → tampilkan form
  res.status(401).send(`
    <html>
      <head><title>PIN Required</title></head>
      <body style="font-family:sans-serif;text-align:center;margin-top:10%;">
        <h2>🔒 Access Restricted</h2>
        <p>Please enter your access PIN to continue:</p>
        <form method="GET">
          <input type="password" name="pin" placeholder="Enter PIN" style="padding:8px;">
          <button type="submit" style="padding:8px;">Enter</button>
        </form>
      </body>
    </html>
  `);
});

// Sajikan file statis
app.use(express.static(__dirname, { extensions: ["html", "js"] }));

// Fallback ke index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Lupis Engine protected running at http://localhost:${PORT}`);
});
