export type RenderMode = 'braille' | 'ascii';

export interface QualityPreset {
  level: number;
  gridW: number;
  gridH: number;
  maxBodies: number;
  spawnRate: number;
  trailFade: number;
  bloomAlpha: number;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { level: 0, gridW: 90, gridH: 34, maxBodies: 220, spawnRate: 30, trailFade: 0.2, bloomAlpha: 0.18 },
  { level: 1, gridW: 110, gridH: 40, maxBodies: 320, spawnRate: 45, trailFade: 0.16, bloomAlpha: 0.2 },
  { level: 2, gridW: 130, gridH: 48, maxBodies: 450, spawnRate: 60, trailFade: 0.13, bloomAlpha: 0.23 },
  { level: 3, gridW: 150, gridH: 56, maxBodies: 620, spawnRate: 85, trailFade: 0.11, bloomAlpha: 0.28 },
  { level: 4, gridW: 170, gridH: 64, maxBodies: 780, spawnRate: 110, trailFade: 0.09, bloomAlpha: 0.34 }
];

export const PALETTE = {
  bg: '#020b08',
  chrome: '#0a1713',
  chromeBorder: '#1a352c',
  phosphor: '#8bf6be',
  phosphorDim: '#4fa57f',
  phosphorGlow: '#65ffba',
  status: '#9afac7',
  warning: '#ffd28b'
};

export const ASCII_RAMP = ' .,:;irsXA253hMHGS#9B&@';
