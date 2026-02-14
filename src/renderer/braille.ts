const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

const DOT_BITS = [
  [0x1, 0x8],
  [0x2, 0x10],
  [0x4, 0x20],
  [0x40, 0x80]
];

export function brailleRows(data: Uint8ClampedArray, width: number, gridW: number, gridH: number): string[] {
  const rows = new Array<string>(gridH);
  for (let gy = 0; gy < gridH; gy++) {
    let line = '';
    const py = gy * 4;
    for (let gx = 0; gx < gridW; gx++) {
      const px = gx * 2;
      let mask = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 2; x++) {
          const idx = ((py + y) * width + (px + x)) * 4;
          const v = data[idx + 1] / 255;
          const t = (BAYER_4[(py + y) & 3][(px + x) & 3] + 0.5) / 16;
          if (v > t * 0.9) mask |= DOT_BITS[y][x];
        }
      }
      line += String.fromCharCode(0x2800 + mask);
    }
    rows[gy] = line;
  }
  return rows;
}

// sanity check dot mapping: upper-left dot1, upper-right dot4 => mask 0x9.
if ((0x2800 + (0x1 | 0x8)) !== 0x2809) {
  throw new Error('Braille mapping mismatch');
}
