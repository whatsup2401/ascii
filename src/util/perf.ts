export class PerfTracker {
  private samples: number[] = [];
  private sampleWindow = 120;
  private lowFpsMs = 0;
  private highFpsMs = 0;

  frame(dtMs: number): number {
    const fps = 1000 / Math.max(dtMs, 1);
    this.samples.push(fps);
    if (this.samples.length > this.sampleWindow) {
      this.samples.shift();
    }
    return fps;
  }

  averageFps(): number {
    if (!this.samples.length) return 60;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  qualitySuggestion(avgFps: number, dtMs: number): -1 | 0 | 1 {
    if (avgFps < 50) {
      this.lowFpsMs += dtMs;
      this.highFpsMs = 0;
      if (this.lowFpsMs > 2000) {
        this.lowFpsMs = 0;
        return -1;
      }
      return 0;
    }
    if (avgFps > 58) {
      this.highFpsMs += dtMs;
      this.lowFpsMs = 0;
      if (this.highFpsMs > 5000) {
        this.highFpsMs = 0;
        return 1;
      }
      return 0;
    }
    this.lowFpsMs = 0;
    this.highFpsMs = 0;
    return 0;
  }
}
