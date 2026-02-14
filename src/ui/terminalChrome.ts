import { PALETTE, RenderMode } from '../util/palette';

export function drawTerminalChrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  topH: number,
  bottomH: number,
  fps: number,
  bodyCount: number,
  mode: RenderMode,
  quality: number,
  gravity: { x: number; y: number },
  hint: string,
  command: string,
  commandFocused: boolean
): void {
  ctx.save();
  ctx.fillStyle = PALETTE.chrome;
  ctx.fillRect(0, 0, w, topH);
  ctx.fillRect(0, h - bottomH, w, bottomH);
  ctx.strokeStyle = PALETTE.chromeBorder;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.beginPath();
  ctx.moveTo(0, topH + 0.5);
  ctx.lineTo(w, topH + 0.5);
  ctx.moveTo(0, h - bottomH + 0.5);
  ctx.lineTo(w, h - bottomH + 0.5);
  ctx.stroke();

  ctx.fillStyle = PALETTE.status;
  ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `FPS ${fps.toFixed(1)} | bodies ${bodyCount} | mode ${mode} | quality ${quality} | gravity ${gravity.x.toFixed(2)},${gravity.y.toFixed(2)} | ${hint}`,
    14,
    topH * 0.52
  );

  const prompt = commandFocused ? '>' : '[Enter]>';
  ctx.fillStyle = commandFocused ? PALETTE.phosphor : PALETTE.phosphorDim;
  ctx.fillText(`${prompt} ${command}`, 14, h - bottomH * 0.48);
  ctx.restore();
}

export function drawHelpOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const lines = [
    'Controls',
    'LMB drag body = grab/throw',
    'LMB on empty = spawn stream',
    'Top 10% click = spawn ball',
    'RMB or Alt+LMB = repulsion burst',
    'Shift+drag = draw static wall',
    'Wheel = brush radius',
    'Space pause | R reset | B mode | T trails | G gravity',
    'Q/E quality | H help | Enter command line'
  ];
  ctx.save();
  ctx.fillStyle = 'rgba(2,11,8,0.9)';
  ctx.fillRect(w * 0.06, h * 0.1, w * 0.88, h * 0.78);
  ctx.strokeStyle = PALETTE.chromeBorder;
  ctx.strokeRect(w * 0.06, h * 0.1, w * 0.88, h * 0.78);
  ctx.fillStyle = PALETTE.status;
  ctx.font = '15px ui-monospace, SFMono-Regular, Menlo, monospace';
  lines.forEach((line, i) => ctx.fillText(line, w * 0.09, h * 0.16 + i * 26));
  ctx.restore();
}
