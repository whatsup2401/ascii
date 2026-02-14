import { PALETTE } from '../util/palette';

export function drawPost(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  w: number,
  h: number,
  bloomAlpha: number,
  noiseSeed: number
): void {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  ctx.filter = 'blur(6px)';
  ctx.globalAlpha = bloomAlpha;
  ctx.drawImage(src, 0, 0, w, h);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.drawImage(src, 0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.03)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  g.addColorStop(1, 'rgba(255,255,255,0.03)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 3) {
    const a = 0.025 + ((y + noiseSeed) % 7) * 0.001;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(0, y, w, 1);
  }

  const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.03;
  ctx.fillStyle = PALETTE.phosphor;
  const n = 110;
  for (let i = 0; i < n; i++) {
    const x = ((i * 17713 + noiseSeed * 391) % 10000) / 10000 * w;
    const y = ((i * 11939 + noiseSeed * 97) % 10000) / 10000 * h;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.restore();
}
