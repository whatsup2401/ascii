import { Composite } from 'matter-js';
import { PhysicsWorld, SerializedScene } from './physics';
import { asciiRows } from './renderer/ascii';
import { brailleRows } from './renderer/braille';
import { FieldBuffer } from './renderer/fieldBuffer';
import { drawPost } from './renderer/post';
import { executeCommand } from './ui/commands';
import { drawHelpOverlay, drawTerminalChrome } from './ui/terminalChrome';
import { PerfTracker } from './util/perf';
import { PALETTE, QUALITY_PRESETS, RenderMode } from './util/palette';

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
const glyphCanvas = document.createElement('canvas');
const glyphCtx = glyphCanvas.getContext('2d')!;
app.appendChild(canvas);

const topBar = 30;
const bottomBar = 34;
const physics = new PhysicsWorld(canvas);
const field = new FieldBuffer();
const perf = new PerfTracker();

let width = 0;
let height = 0;
let mode: RenderMode = 'braille';
let quality = 2;
let trails = true;
let help = true;
let paused = false;
let hint = 'Alt+LMB for burst, Enter for commands';
let command = '';
let commandFocused = false;
let brushRadius = 90;
let manualQuality = false;
let gravityIndex = 0;
const gravityCycle = [
  { x: 0, y: 1 },
  { x: 0, y: 0 },
  { x: 0, y: -1 },
  { x: 0.55, y: 0.2 }
];

let mouseX = 0;
let mouseY = 0;
let leftDown = false;
let shiftDown = false;
let streamAccumulator = 0;
let wallStart: { x: number; y: number } | null = null;

function applyQuality(level: number): void {
  quality = Math.max(0, Math.min(4, level));
  const preset = QUALITY_PRESETS[quality];
  field.resize(preset.gridW, preset.gridH);
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  glyphCanvas.width = width;
  glyphCanvas.height = height;

  physics.resize(width, height - topBar - bottomBar);
}

applyQuality(quality);
resize();
for (let i = 0; i < 60; i++) {
  physics.spawnBall(width * (0.25 + Math.random() * 0.5), 50 + Math.random() * 80, 6 + Math.random() * 9);
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('resize', resize);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') shiftDown = true;
  if (commandFocused) {
    if (e.key === 'Escape') {
      commandFocused = false;
    } else if (e.key === 'Enter') {
      hint = executeCommand(command, {
        reset: () => physics.reset(),
        spawnBalls: (count, radius) => {
          for (let i = 0; i < count; i++) physics.spawnBall(40 + Math.random() * (width - 80), 40 + Math.random() * 80, radius);
        },
        spawnBoxes: (count, size) => {
          for (let i = 0; i < count; i++) physics.spawnBox(40 + Math.random() * (width - 80), 40 + Math.random() * 80, size);
        },
        setGravity: (x, y) => physics.setGravity(x, y),
        setQuality: (q, manual) => {
          manualQuality = manual;
          applyQuality(q);
        },
        setMode: (m) => (mode = m),
        setTrails: (t) => (trails = t),
        setBurstStrength: (s) => (physics.burstStrength = s),
        saveScene: (): SerializedScene =>
          physics.serialize({
            gravityX: physics.engine.gravity.x,
            gravityY: physics.engine.gravity.y,
            quality,
            mode,
            trails,
            burstStrength: physics.burstStrength
          }),
        loadScene: (scene) => {
          mode = scene.settings.mode;
          trails = scene.settings.trails;
          physics.burstStrength = scene.settings.burstStrength;
          applyQuality(scene.settings.quality);
          physics.setGravity(scene.settings.gravityX, scene.settings.gravityY);
          physics.load(scene);
        }
      });
      command = '';
    } else if (e.key === 'Backspace') {
      command = command.slice(0, -1);
      e.preventDefault();
    } else if (e.key.length === 1) {
      command += e.key;
    }
    return;
  }

  switch (e.key.toLowerCase()) {
    case ' ':
      paused = !paused;
      break;
    case 'r':
      physics.reset();
      break;
    case 'b':
      mode = mode === 'braille' ? 'ascii' : 'braille';
      break;
    case 't':
      trails = !trails;
      break;
    case 'g':
      gravityIndex = (gravityIndex + 1) % gravityCycle.length;
      physics.setGravity(gravityCycle[gravityIndex].x, gravityCycle[gravityIndex].y);
      break;
    case 'q':
      manualQuality = true;
      applyQuality(quality - 1);
      break;
    case 'e':
      manualQuality = true;
      applyQuality(quality + 1);
      break;
    case 'h':
      help = !help;
      break;
    case 'enter':
      commandFocused = true;
      command = ':';
      break;
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') shiftDown = false;
});

canvas.addEventListener('pointermove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY - topBar;
  if (shiftDown && leftDown && wallStart) {
    // live preview handled in draw
  }
});
canvas.addEventListener('wheel', (e) => {
  brushRadius = Math.max(20, Math.min(260, brushRadius + Math.sign(e.deltaY) * 8));
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('pointerdown', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY - topBar;
  leftDown = e.button === 0;
  if (e.button === 2 || (e.button === 0 && e.altKey)) {
    physics.applyRepulse(mouseX, mouseY, brushRadius);
    return;
  }
  if (shiftDown && e.button === 0) {
    wallStart = { x: mouseX, y: mouseY };
    return;
  }
  if (e.button === 0 && e.clientY < topBar + (height - topBar - bottomBar) * 0.1) {
    physics.spawnBall(mouseX, mouseY, 10 + Math.random() * 8);
  }
});
canvas.addEventListener('pointerup', (e) => {
  leftDown = false;
  if (shiftDown && wallStart) {
    physics.addSegment(wallStart.x, wallStart.y, e.clientX, e.clientY - topBar, 8);
    wallStart = null;
  }
});

let last = performance.now();
let accumulator = 0;
const step = 1000 / 120;

function frame(now: number): void {
  const dt = now - last;
  last = now;
  accumulator += Math.min(50, dt);
  const fps = perf.frame(dt);
  const preset = QUALITY_PRESETS[quality];

  if (!paused) {
    while (accumulator >= step) {
      if (leftDown && !shiftDown && !physics.mouseConstraint.body) {
        streamAccumulator += step;
        const interval = 1000 / preset.spawnRate;
        while (streamAccumulator >= interval) {
          streamAccumulator -= interval;
          physics.spawnBall(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8, 4 + Math.random() * 3);
        }
      }
      physics.step(step);
      accumulator -= step;
    }
  }

  physics.enforceBodyBudget(preset);

  if (!manualQuality) {
    const suggestion = perf.qualitySuggestion(perf.averageFps(), dt);
    if (suggestion !== 0) applyQuality(quality + suggestion);
  }

  const sceneH = height - topBar - bottomBar;
  const renderBodies = Composite.allBodies(physics.engine.world)
    .filter((b) => !b.isStatic)
    .map((b) => ({ ...b, position: { x: b.position.x, y: b.position.y } }));

  const data = field.rasterize(renderBodies as any, physics.sparks, width, sceneH, trails, preset.trailFade);
  const rows = mode === 'braille' ? brailleRows(data, field.width, field.gridW, field.gridH) : asciiRows(data, field.width, field.gridW, field.gridH);

  glyphCtx.clearRect(0, 0, width, height);
  glyphCtx.fillStyle = PALETTE.bg;
  glyphCtx.fillRect(0, 0, width, height);
  glyphCtx.fillStyle = PALETTE.phosphor;
  glyphCtx.font = `${Math.floor(sceneH / field.gridH)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  glyphCtx.textBaseline = 'top';
  const yStart = topBar + 2;
  for (let y = 0; y < rows.length; y++) {
    glyphCtx.fillText(rows[y], 8, yStart + y * (sceneH / field.gridH));
  }

  drawPost(ctx, glyphCanvas, width, height, preset.bloomAlpha, Math.floor(now / 30));

  if (wallStart) {
    ctx.strokeStyle = PALETTE.warning;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallStart.x, wallStart.y + topBar);
    ctx.lineTo(mouseX, mouseY + topBar);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(154,250,199,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY + topBar, brushRadius, 0, Math.PI * 2);
  ctx.stroke();

  drawTerminalChrome(
    ctx,
    width,
    height,
    topBar,
    bottomBar,
    fps,
    Composite.allBodies(physics.engine.world).filter((b) => !b.isStatic).length,
    mode,
    quality,
    physics.engine.gravity,
    hint,
    command,
    commandFocused
  );

  if (help) drawHelpOverlay(ctx, width, height);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
