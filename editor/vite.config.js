import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import svgLoader from 'vite-svg-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 37600;

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: PORT,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100, 
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'editor'
    ],
    hmr: {
      overlay: true,
      clientPort: PORT, 
    },
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, '../core'),
        path.resolve(__dirname, '../service'),
        path.resolve(__dirname, './'),
        path.resolve(__dirname, 'node_modules'),
      ],
    },
  },

  plugins: [
    vue(),
    ...(process.env.DISABLE_DEVTOOLS === 'true' || process.env.CI ? [] : [vueDevTools()]),
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
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@docs': fileURLToPath(new URL('./src/features/docs', import.meta.url)),
      '@projects': fileURLToPath(new URL('./src/features/projects', import.meta.url)),
      '@workspaces': fileURLToPath(new URL('./src/features/workspaces', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/features/assets', import.meta.url)),
      '@folders': fileURLToPath(new URL('./src/features/folders', import.meta.url)),
      '@prefabs': fileURLToPath(new URL('./src/features/prefabs', import.meta.url)),
      '@opfs': fileURLToPath(new URL('./src/features/opfs', import.meta.url)),
      '@scripts': fileURLToPath(new URL('./src/features/scripts', import.meta.url)),
      '@scenes': fileURLToPath(new URL('./src/features/scenes', import.meta.url)),
      '@consoles': fileURLToPath(new URL('./src/features/consoles', import.meta.url)),
      '@nodes': fileURLToPath(new URL('./src/features/nodes', import.meta.url)),
      '@animators': fileURLToPath(new URL('./src/features/animators', import.meta.url)),
      '@inspectors': fileURLToPath(new URL('./src/features/inspectors', import.meta.url)),
      '@builders': fileURLToPath(new URL('./src/features/builders', import.meta.url)),
      '@viewports': fileURLToPath(new URL('./src/features/viewports', import.meta.url)),
      '@settings': fileURLToPath(new URL('./src/features/settings', import.meta.url)),
      '@dashboards': fileURLToPath(new URL('./src/features/dashboards', import.meta.url)),
      '@historys': fileURLToPath(new URL('./src/features/historys', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@tests': path.resolve(__dirname, './tests'),
      '@core': path.resolve(__dirname, '../core'),
      '/core': path.resolve(__dirname, '../core'),
      '@engines': fileURLToPath(new URL('./src/features/engines', import.meta.url)),
      'vue': 'vue/dist/vue.esm-bundler.js',
      'terser': fs.existsSync(path.resolve(__dirname, '../service/node_modules/terser'))
        ? path.resolve(__dirname, '../service/node_modules/terser')
        : 'terser',
      'msdfgen-wasm': path.resolve(__dirname, 'node_modules/msdfgen-wasm/dist/cjs/index.js'),
    },
  },

  test: {
    globals: true,
    environment: 'happy-dom', 
    include: [
      'tests/unit/**/*.spec.js',
      'tests/integration/**/*.spec.js',
      'tests/system/**/*.spec.js'
    ]
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
        preview: path.resolve(__dirname, 'preview/index.html'),
      },
    },
  },
});
