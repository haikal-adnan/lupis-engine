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

    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        'src',            
        '../engine',      
        'node_modules',   
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@commons': fileURLToPath(new URL('./src/commons', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),

      '@ui': fileURLToPath(new URL('./src/commons/components', import.meta.url)),

      '@engines': path.resolve(__dirname, '../engine'),

      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/engine/, /node_modules/],
    },
  },
});