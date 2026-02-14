import { SerializedScene } from '../physics';
import { RenderMode } from '../util/palette';

export interface CommandContext {
  reset: () => void;
  spawnBalls: (count: number, radius?: number) => void;
  spawnBoxes: (count: number, size?: number) => void;
  setGravity: (x: number, y: number) => void;
  setQuality: (q: number, manual: boolean) => void;
  setMode: (m: RenderMode) => void;
  setTrails: (t: boolean) => void;
  setBurstStrength: (s: number) => void;
  saveScene: () => SerializedScene;
  loadScene: (scene: SerializedScene) => void;
}

export function executeCommand(input: string, ctx: CommandContext): string {
  const raw = input.trim();
  if (!raw.startsWith(':')) return 'Commands start with :';
  const parts = raw.slice(1).split(/\s+/);
  const [cmd, ...args] = parts;

  switch (cmd) {
    case 'help':
      return ':help :reset :spawn balls n [r] :spawn boxes n [s] :gravity x y :quality 0..4 :mode braille|ascii :trails on|off :burst n :save :load';
    case 'reset':
      ctx.reset();
      return 'Scene reset';
    case 'spawn': {
      const kind = args[0];
      const count = Number(args[1] ?? '10');
      const size = Number(args[2] ?? (kind === 'boxes' ? '22' : '10'));
      if (kind === 'balls') {
        ctx.spawnBalls(Math.max(1, count), size);
        return `Spawned ${count} balls`;
      }
      if (kind === 'boxes') {
        ctx.spawnBoxes(Math.max(1, count), size);
        return `Spawned ${count} boxes`;
      }
      return 'Usage: :spawn balls|boxes <n> [size]';
    }
    case 'gravity': {
      const x = Number(args[0]);
      const y = Number(args[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        ctx.setGravity(x, y);
        return `Gravity ${x}, ${y}`;
      }
      return 'Usage: :gravity <x> <y>';
    }
    case 'quality': {
      const q = Number(args[0]);
      if (q >= 0 && q <= 4) {
        ctx.setQuality(q, true);
        return `Quality ${q}`;
      }
      return 'Usage: :quality <0..4>';
    }
    case 'mode': {
      const m = args[0] as RenderMode;
      if (m === 'braille' || m === 'ascii') {
        ctx.setMode(m);
        return `Mode ${m}`;
      }
      return 'Usage: :mode braille|ascii';
    }
    case 'trails':
      if (args[0] === 'on' || args[0] === 'off') {
        ctx.setTrails(args[0] === 'on');
        return `Trails ${args[0]}`;
      }
      return 'Usage: :trails on|off';
    case 'burst': {
      const s = Number(args[0]);
      if (Number.isFinite(s)) {
        ctx.setBurstStrength(s);
        return `Burst ${s}`;
      }
      return 'Usage: :burst <strength>';
    }
    case 'save': {
      const scene = ctx.saveScene();
      const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ascii-physics-scene.json';
      a.click();
      URL.revokeObjectURL(a.href);
      return 'Scene saved';
    }
    case 'load': {
      const inputEl = document.createElement('input');
      inputEl.type = 'file';
      inputEl.accept = 'application/json';
      inputEl.onchange = async () => {
        const file = inputEl.files?.[0];
        if (!file) return;
        const text = await file.text();
        const parsed = JSON.parse(text) as SerializedScene;
        if (parsed.version !== 1) throw new Error('Unsupported scene version');
        ctx.loadScene(parsed);
      };
      inputEl.click();
      return 'Pick scene file...';
    }
    default:
      return `Unknown command: ${cmd}`;
  }
}
