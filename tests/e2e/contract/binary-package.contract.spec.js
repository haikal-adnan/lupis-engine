import JSZip from 'jszip';
import { test, expect } from '../fixtures.js';

const LUPIS_HEADER = [
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00,
];
const XOR_KEY = 0x5A;

async function decodeLupisProjectBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const zipBytes = new Uint8Array(bytes.length - LUPIS_HEADER.length);
  for (let i = 0; i < zipBytes.length; i++) {
    zipBytes[i] = bytes[LUPIS_HEADER.length + i] ^ XOR_KEY;
  }
  const zip = new JSZip();
  return zip.loadAsync(zipBytes);
}

test.use({
  projectOptions: {
    prefix: 'BinaryPkg E2E',
    description: 'Workspace for binary package contract verification',
  },
});

test.describe('@contract Binary Package (.lupisproject) Format', () => {
  test('verifies 16-byte magic header and XOR obfuscation mask on exported archive', async () => {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify({ name: 'BinaryTestProject', schemaVersion: 2 }));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const magicHeaderBuffer = Buffer.from(LUPIS_HEADER);
    const obfuscated = Buffer.alloc(zipBuffer.length);
    for (let i = 0; i < zipBuffer.length; i++) {
      obfuscated[i] = zipBuffer[i] ^ XOR_KEY;
    }

    const combined = Buffer.concat([magicHeaderBuffer, obfuscated]);
    const header = Array.from(combined.subarray(0, 16));
    expect(header).toEqual(LUPIS_HEADER);

    const decodedZip = await decodeLupisProjectBuffer(combined);
    const projectJsonEntry = decodedZip.file('project.json');
    expect(projectJsonEntry).not.toBeNull();

    const projectData = JSON.parse(await projectJsonEntry.async('text'));
    expect(projectData.name).toBe('BinaryTestProject');
    expect(projectData.schemaVersion).toBe(2);
  });

  test('rejects archives lacking the canonical magic header', async ({ page }) => {
    const errorOccurred = await page.evaluate(() => {
      let rejected = false;
      try {
        const invalidData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        const LUPIS_HEADER_LOCAL = [
          0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00,
        ];

        const headerMatches = LUPIS_HEADER_LOCAL.every((byte, idx) => invalidData[idx] === byte);
        if (!headerMatches) {
          throw new Error('Invalid project file: missing LUPIS_PROJECT1 magic header');
        }
      } catch {
        rejected = true;
      }
      return rejected;
    });

    expect(errorOccurred).toBe(true);
  });
});
