import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 6500, // atau 5174, sesuaikan
    allowedHosts: [
      'lupis-visual.calk.cloud',
      'lupis-engine.calk.cloud',
      'lupis.calk.cloud',
      'localhost',
    ],
    hmr: {
      overlay: true // ubah ke false jika ingin matikan tampilan error overlay merah
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      // === Alias bawaan untuk folder src (frontend sendiri) ===
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      "@engine": fileURLToPath(new URL("../new-engine", import.meta.url)),
      "@utils": fileURLToPath(new URL("../utils", import.meta.url)), // ✅ tambahkan ini
      "@projects": fileURLToPath(new URL("../projects", import.meta.url)), // opsional
      // === Alias eksternal menuju folder di luar frontend ===
      '@engine': path.resolve(__dirname, '../new-engine'),
      '@utils': path.resolve(__dirname, '../utils'),
      '@schemas': path.resolve(__dirname, '../schemas'),
      '@projects': path.resolve(__dirname, '../projects'),
      '@backend': path.resolve(__dirname, '../backend'),
    },
  },
});
