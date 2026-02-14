import {
  Body,
  Bodies,
  Composite,
  Constraint,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Runner,
  Vector,
  World
} from 'matter-js';
import { QualityPreset } from './util/palette';

export type BodyKind = 'ball' | 'box' | 'segment';

export interface Spark {
  x: number;
  y: number;
  life: number;
  size: number;
}

export interface SerializedScene {
  version: 1;
  settings: {
    gravityX: number;
    gravityY: number;
    quality: number;
    mode: 'braille' | 'ascii';
    trails: boolean;
    burstStrength: number;
  };
  bodies: Array<{ type: 'ball' | 'box'; x: number; y: number; vx: number; vy: number; angle: number; size: number }>;
  segments: Array<{ x1: number; y1: number; x2: number; y2: number; thickness: number }>;
}

export class PhysicsWorld {
  readonly engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
  private runner = Runner.create();
  readonly mouseConstraint: MouseConstraint;
  readonly sparks: Spark[] = [];
  segments: Body[] = [];
  width = 100;
  height = 100;
  burstStrength = 0.022;

  constructor(private element: HTMLElement) {
    const mouse = Mouse.create(element);
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: {
        stiffness: 0.1,
        damping: 0.18,
        angularStiffness: 0.02,
        render: { visible: false }
      }
    });
    Composite.add(this.engine.world, this.mouseConstraint);
    this.createBounds();
    this.addInteriorObstacles();
    Events.on(this.engine, 'collisionStart', (ev) => {
      for (const pair of ev.pairs) {
        const c = pair.collision.supports[0];
        this.sparks.push({ x: c.x, y: c.y, life: 0.7, size: 2 + Math.random() * 3 });
      }
      if (this.sparks.length > 220) this.sparks.splice(0, this.sparks.length - 220);
    });
  }

  step(dtMs: number): void {
    Runner.tick(this.runner, this.engine, dtMs);
    this.trimSparks(dtMs / 1000);
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.rebuildBounds();
  }

  setGravity(x: number, y: number): void {
    this.engine.gravity.x = x;
    this.engine.gravity.y = y;
  }

  spawnBall(x: number, y: number, radius = 10): Body {
    const ball = Bodies.circle(x, y, radius, {
      restitution: 0.85,
      friction: 0.02,
      frictionAir: 0.004,
      label: 'ball'
    });
    Composite.add(this.engine.world, ball);
    return ball;
  }

  spawnBox(x: number, y: number, size = 20): Body {
    const box = Bodies.rectangle(x, y, size, size, {
      restitution: 0.35,
      friction: 0.05,
      frictionAir: 0.006,
      label: 'box'
    });
    Composite.add(this.engine.world, box);
    return box;
  }

  addSegment(x1: number, y1: number, x2: number, y2: number, thickness = 8): void {
    const midX = (x1 + x2) * 0.5;
    const midY = (y1 + y2) * 0.5;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 4) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const seg = Bodies.rectangle(midX, midY, len, thickness, { isStatic: true, angle, label: 'segment' });
    this.segments.push(seg);
    Composite.add(this.engine.world, seg);
  }

  applyRepulse(x: number, y: number, radius: number): void {
    const radiusSq = radius * radius;
    for (const body of Composite.allBodies(this.engine.world)) {
      if (body.isStatic) continue;
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq || distSq < 1) continue;
      const dist = Math.sqrt(distSq);
      const falloff = 1 - dist / radius;
      const forceScale = this.burstStrength * falloff * body.mass;
      const dir = Vector.normalise({ x: dx, y: dy });
      Body.applyForce(body, body.position, { x: dir.x * forceScale, y: dir.y * forceScale });
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > 24) {
        Body.setVelocity(body, {
          x: (body.velocity.x / speed) * 24,
          y: (body.velocity.y / speed) * 24
        });
      }
    }
  }

  enforceBodyBudget(q: QualityPreset): void {
    const dynamic = Composite.allBodies(this.engine.world).filter((b) => !b.isStatic);
    for (const b of dynamic) {
      if (b.position.y > this.height + 200 || b.position.x < -200 || b.position.x > this.width + 200) {
        Composite.remove(this.engine.world, b);
      }
    }
    const left = Composite.allBodies(this.engine.world).filter((b) => !b.isStatic);
    if (left.length > q.maxBodies) {
      const excess = left.slice(0, left.length - q.maxBodies);
      excess.forEach((b) => Composite.remove(this.engine.world, b));
    }
  }

  reset(): void {
    const world = this.engine.world;
    Composite.clear(world, false, true);
    this.segments = [];
    this.sparks.length = 0;
    Composite.add(world, this.mouseConstraint);
    this.createBounds();
    this.addInteriorObstacles();
  }

  serialize(settings: SerializedScene['settings']): SerializedScene {
    const bodies = Composite.allBodies(this.engine.world)
      .filter((b) => !b.isStatic && (b.label === 'ball' || b.label === 'box'))
      .map((b) => ({
        type: b.label as 'ball' | 'box',
        x: b.position.x,
        y: b.position.y,
        vx: b.velocity.x,
        vy: b.velocity.y,
        angle: b.angle,
        size: b.label === 'ball' ? (b.circleRadius ?? 8) : Math.max(b.bounds.max.x - b.bounds.min.x, 8)
      }));
    const segments = this.segments.map((seg) => {
      const w = seg.bounds.max.x - seg.bounds.min.x;
      const x1 = seg.position.x - Math.cos(seg.angle) * w * 0.5;
      const y1 = seg.position.y - Math.sin(seg.angle) * w * 0.5;
      const x2 = seg.position.x + Math.cos(seg.angle) * w * 0.5;
      const y2 = seg.position.y + Math.sin(seg.angle) * w * 0.5;
      return { x1, y1, x2, y2, thickness: 8 };
    });
    return { version: 1, settings, bodies, segments };
  }

  load(scene: SerializedScene): void {
    this.reset();
    for (const seg of scene.segments) this.addSegment(seg.x1, seg.y1, seg.x2, seg.y2, seg.thickness);
    for (const b of scene.bodies) {
      const body = b.type === 'ball' ? this.spawnBall(b.x, b.y, b.size) : this.spawnBox(b.x, b.y, b.size);
      Body.setAngle(body, b.angle);
      Body.setVelocity(body, { x: b.vx, y: b.vy });
    }
  }

  private trimSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].life -= dt * 2.3;
      if (this.sparks[i].life <= 0) this.sparks.splice(i, 1);
    }
  }

  private createBounds(): void {
    const t = 50;
    const wallOpts = { isStatic: true, label: 'boundary' };
    Composite.add(this.engine.world, [
      Bodies.rectangle(this.width * 0.5, this.height + t * 0.5, this.width + t * 2, t, wallOpts),
      Bodies.rectangle(this.width * 0.5, -t * 0.5, this.width + t * 2, t, wallOpts),
      Bodies.rectangle(-t * 0.5, this.height * 0.5, t, this.height + t * 2, wallOpts),
      Bodies.rectangle(this.width + t * 0.5, this.height * 0.5, t, this.height + t * 2, wallOpts)
    ]);
  }

  private rebuildBounds(): void {
    const toRemove = Composite.allBodies(this.engine.world).filter((b) => b.label === 'boundary' || b.label === 'peg');
    toRemove.forEach((b) => Composite.remove(this.engine.world, b));
    this.createBounds();
    this.addInteriorObstacles();
  }

  private addInteriorObstacles(): void {
    const pegs: Body[] = [];
    for (let i = 0; i < 7; i++) {
      pegs.push(
        Bodies.circle(this.width * (0.2 + i * 0.1), this.height * (0.3 + (i % 2) * 0.12), 14, {
          isStatic: true,
          label: 'peg'
        })
      );
    }
    const ramp = Bodies.rectangle(this.width * 0.72, this.height * 0.68, 200, 14, {
      isStatic: true,
      angle: -0.4,
      label: 'peg'
    });
    Composite.add(this.engine.world, [...pegs, ramp]);
  }
}
