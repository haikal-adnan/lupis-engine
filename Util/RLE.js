// Util/RLE.js
export function decodeRLE(rleData, width, height) {
  if (!rleData) return [];

  // Flatten array dari [count, value]
  const flat = [];
  for (const [count, value] of rleData) {
    for (let i = 0; i < count; i++) flat.push(value);
  }

  // Pastikan panjang sesuai
  const total = width * height;
  if (flat.length < total) {
    console.warn(`⚠️ RLE data lebih pendek (${flat.length}) dari expected (${total})`);
    while (flat.length < total) flat.push(0);
  } else if (flat.length > total) {
    flat.length = total;
  }

  // Ubah ke 2D array
  const rows = [];
  for (let y = 0; y < height; y++) {
    const start = y * width;
    const end = start + width;
    rows.push(flat.slice(start, end));
  }
  return rows;
}
