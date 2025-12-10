import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import svgLoader from 'vite-svg-loader'

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
      overlay: true, // ubah ke false jika ingin matikan tampilan error overlay merah
    },

    // ⬇️ IZINKAN AKSES FOLDER DI LUAR ROOT FRONTEND
    fs: {
      allow: [
        '..', // folder di atas root frontend
        '../engine',
        '../utils',
        '../projects',
        '../schemas',
        '../backend',
        '../public',
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
    })],

  resolve: {
    alias: {
      // === Alias bawaan untuk folder src (frontend sendiri) ===
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      // === Alias eksternal menuju folder di luar frontend ===
      '@engine': path.resolve(__dirname, '../engine'),
      '@utils': path.resolve(__dirname, '../utils'),
      '@schemas': path.resolve(__dirname, '../schemas'),
      '@projects': path.resolve(__dirname, '../projects'),
      '@backend': path.resolve(__dirname, '../backend'),
      '@public': path.resolve(__dirname, '../public'),
    },
  },
});
