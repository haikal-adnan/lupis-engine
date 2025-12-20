import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 6500,
    allowedHosts: [
      'lupis.calk.cloud',
      'localhost',
    ],
    hmr: {
      overlay: true,
    },

    // ✅ HANYA IZINKAN FOLDER KODE/LOGIC YANG DIBUTUHKAN UNTUK BUILD
    // Folder data seperti '../projects' atau '../backend' dihapus dari sini demi keamanan
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        'src',               // Folder frontend sendiri
        '../engine',         // Logic core engine
        '../utils',          // Fungsi helper bersama
        '../schemas',        // Skema data/validasi bersama
        'node_modules',      // Dependensi
      ],
    },
  },

  plugins: [
    vue(),
    vueDevTools(),
    svgLoader({
      defaultImport: 'component',
      svgoConfig: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          'removeDimensions',
        ],
      },
    })
  ],

  resolve: {
    alias: {
      // === Alias untuk folder src (Frontend) ===
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      // === Alias untuk LOGIC (Boleh diakses Vite untuk kompilasi) ===
      '@engine': path.resolve(__dirname, '../engine'),
      '@utils': path.resolve(__dirname, '../utils'),
      '@schemas': path.resolve(__dirname, '../schemas'),
      
      // ❌ ALIAS UNTUK DATA SEPERTI @projects DIHAPUS
      // Data sekarang diakses via CDN_URL melalui HTTP, bukan via filesystem alias
    },
  },

  // Menangani build agar tetap rapi jika ada file di luar root
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/engine/, /node_modules/],
    },
  },
});