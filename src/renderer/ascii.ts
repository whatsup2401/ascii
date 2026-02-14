import { ASCII_RAMP } from '../util/palette';

export function asciiRows(data: Uint8ClampedArray, width: number, gridW: number, gridH: number): string[] {
  const rows = new Array<string>(gridH);
  const max = ASCII_RAMP.length - 1;
  for (let gy = 0; gy < gridH; gy++) {
    let line = '';
    for (let gx = 0; gx < gridW; gx++) {
      let sum = 0;
      const px = gx * 2;
      const py = gy * 4;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 2; x++) {
          const idx = ((py + y) * width + (px + x)) * 4;
          sum += data[idx + 1];
        }
      }
      const v = sum / (8 * 255);
      line += ASCII_RAMP[Math.max(0, Math.min(max, Math.floor(v * max)))];
    }
    rows[gy] = line;
  }
  return rows;
}
