import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import svgLoader from 'vite-svg-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: '0.0.0.0',
    appType: 'mpa',
    port: 6500,
    allowedHosts: [
      'dev-lupis.calk.my.id',
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
        './',             
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
      '@editors': fileURLToPath(new URL('./src/modules/editors', import.meta.url)),
      '@dashboards' : fileURLToPath(new URL('./src/modules/dashboards', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@schemas': fileURLToPath(new URL('./src/services/schema', import.meta.url)),
      '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/commons/components', import.meta.url)),
      '@engines': path.resolve(__dirname, '../engine'),
      '/engine': path.resolve(__dirname, '../engine'),
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/engine/, /node_modules/],
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), 
        preview: path.resolve(__dirname, 'preview/index.html') 
      }
    }
  },
});