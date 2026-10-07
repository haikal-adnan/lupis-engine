import { test, expect } from '@playwright/test';

// test.beforeEach(async ({ page }) => {
//   // Injeksi Polyfill/Mock OPFS ke Navigator prototype
//   await page.addInitScript(() => {
//     const createMockDir = (dirName = 'root') => {
//       const storageMap = new Map();

//       return {
//         kind: 'directory',
//         name: dirName,
//         getDirectoryHandle: async (name, opts = {}) => {
//           if (!storageMap.has(name)) {
//             if (opts.create) {
//               storageMap.set(name, createMockDir(name));
//             } else {
//               throw new Error(`Directory ${name} tidak ditemukan`);
//             }
//           }
//           return storageMap.get(name);
//         },
//         getFileHandle: async (name, opts = {}) => {
//           if (!storageMap.has(name)) {
//             if (opts.create) {
//               storageMap.set(name, {
//                 kind: 'file',
//                 name,
//                 getFile: async () => new Blob(['[]'], { type: 'application/json' }),
//                 createWritable: async () => ({
//                   write: async () => {},
//                   close: async () => {},
//                 }),
//               });
//             } else {
//               throw new Error(`File ${name} tidak ditemukan`);
//             }
//           }
//           return storageMap.get(name);
//         },
//         removeEntry: async (name) => {
//           storageMap.delete(name);
//         },
//         entries: async function* () {
//           for (const entry of storageMap.entries()) yield entry;
//         },
//         values: async function* () {
//           for (const val of storageMap.values()) yield val;
//         },
//         keys: async function* () {
//           for (const key of storageMap.keys()) yield key;
//         },
//       };
//     };

//     const mockStorage = {
//       getDirectory: async () => createMockDir('root'),
//       estimate: async () => ({ quota: 1000000000, usage: 0 }),
//       persisted: async () => true,
//       persist: async () => true,
//     };

//     // Terapkan mock langsung pada prototype Navigator agar tidak tertimpa
//     Object.defineProperty(Navigator.prototype, 'storage', {
//       get() {
//         return mockStorage;
//       },
//       configurable: true,
//       enumerable: true,
//     });
//   });
// });

test('Editor Lupis Engine dapat dimuat dengan baik', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Console Error] ${msg.text()}`);
  });

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);

  const appRoot = page.locator('#app');
  await expect(appRoot).toBeVisible({ timeout: 10000 });
});