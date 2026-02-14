import { Body } from 'matter-js';
import { Spark } from '../physics';

export class FieldBuffer {
  readonly canvas = document.createElement('canvas');
  readonly ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  gridW = 120;
  gridH = 40;
  width = 240;
  height = 160;

  constructor() {
    this.ctx.imageSmoothingEnabled = true;
  }

  resize(gridW: number, gridH: number): void {
    this.gridW = gridW;
    this.gridH = gridH;
    this.width = gridW * 2;
    this.height = gridH * 4;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  rasterize(bodies: Body[], sparks: Spark[], sceneW: number, sceneH: number, trails: boolean, trailFade: number): Uint8ClampedArray {
    const ctx = this.ctx;
    if (!trails) {
      ctx.clearRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = `rgba(0,0,0,${trailFade})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const sx = this.width / sceneW;
    const sy = this.height / sceneH;

    ctx.globalCompositeOperation = 'lighter';
    for (const body of bodies) {
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      const glow = Math.min(1, 0.25 + speed * 0.05);
      ctx.fillStyle = `rgba(180,255,220,${0.18 + glow * 0.35})`;
      ctx.beginPath();
      if (body.circleRadius) {
        ctx.arc(body.position.x * sx, body.position.y * sy, Math.max(1, body.circleRadius * sx), 0, Math.PI * 2);
      } else {
        const w = (body.bounds.max.x - body.bounds.min.x) * sx;
        const h = (body.bounds.max.y - body.bounds.min.y) * sy;
        ctx.save();
        ctx.translate(body.position.x * sx, body.position.y * sy);
        ctx.rotate(body.angle);
        ctx.rect(-w * 0.5, -h * 0.5, w, h);
        ctx.restore();
      }
      ctx.fill();
    }

    for (const s of sparks) {
      const alpha = Math.max(0, s.life);
      ctx.fillStyle = `rgba(240,255,250,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x * sx, s.y * sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    return ctx.getImageData(0, 0, this.width, this.height).data;
  }
}
