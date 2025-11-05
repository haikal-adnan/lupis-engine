export default class Mat4 {
  // ======== Dasar ========

  // Membuat matriks identitas baru
  static identity(out = new Float32Array(16)) {
    out.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    return out;
  }

  // Menyalin matriks
  static copy(out, a) {
    out.set(a);
    return out;
  }

  // ======== Transformasi 2D ========

  // Translasi (geser)
  static translate(out, a, tx, ty, tz = 0) {
    const x = tx, y = ty, z = tz;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      return out;
    }
    // Kalau berbeda, salin dulu
    for (let i = 0; i < 12; i++) out[i] = a[i];
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    return out;
  }

  // Skala
  static scale(out, a, sx, sy, sz = 1) {
    out[0] = a[0] * sx; out[1] = a[1] * sx; out[2] = a[2] * sx; out[3] = a[3] * sx;
    out[4] = a[4] * sy; out[5] = a[5] * sy; out[6] = a[6] * sy; out[7] = a[7] * sy;
    out[8] = a[8] * sz; out[9] = a[9] * sz; out[10] = a[10] * sz; out[11] = a[11] * sz;
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    return out;
  }

  // Rotasi di bidang XY (2D)
  static rotateZ(out, a, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);

    const a0 = a[0], a4 = a[4];
    const a1 = a[1], a5 = a[5];
    const a2 = a[2], a6 = a[6];
    const a3 = a[3], a7 = a[7];

    out[0] = a0 * c + a4 * s;
    out[4] = a0 * -s + a4 * c;
    out[1] = a1 * c + a5 * s;
    out[5] = a1 * -s + a5 * c;
    out[2] = a2 * c + a6 * s;
    out[6] = a2 * -s + a6 * c;
    out[3] = a3 * c + a7 * s;
    out[7] = a3 * -s + a7 * c;

    out[8]  = a[8];  out[9]  = a[9];
    out[10] = a[10]; out[11] = a[11];
    out[12] = a[12]; out[13] = a[13];
    out[14] = a[14]; out[15] = a[15];
    return out;
  }

  // ======== Proyeksi ========

  // Proyeksi ortografik (kamera 2D)
  static ortho(out, left, right, bottom, top, near = -1, far = 1) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    out[0]  = -2 * lr;
    out[1]  = 0;
    out[2]  = 0;
    out[3]  = 0;

    out[4]  = 0;
    out[5]  = -2 * bt;
    out[6]  = 0;
    out[7]  = 0;

    out[8]  = 0;
    out[9]  = 0;
    out[10] = 2 * nf;
    out[11] = 0;

    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }

  // ======== Operasi dasar ========

  // Perkalian matriks (out = a * b)
  static multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0, b1, b2, b3;
    b0 = b[0]; b1 = b[1]; b2 = b[2]; b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8]  = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9]  = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return out;
  }

  // ======== Utilitas ========

  static create() {
    return new Float32Array(16);
  }

  static log(m, label = "Mat4") {
    console.log(`${label}:`);
    for (let i = 0; i < 4; i++) {
      console.log(
        Array.from(m.slice(i * 4, i * 4 + 4))
          .map(v => v.toFixed(3))
          .join("\t")
      );
    }
  }
}
