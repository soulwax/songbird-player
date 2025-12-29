// File: src/components/visualizers/flowfieldPatterns/types.ts

export interface FlowFieldPatternContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  hueBase: number;
  TWO_PI: number;

  fastSin: (angle: number) => number;
  fastCos: (angle: number) => number;
  fastSqrt: (x: number) => number;
  fastMod360: (x: number) => number;
  hsla: (h: number, s: number, l: number, a: number) => string;

  rayCount?: number;
  kaleidoscopeSegments?: number;
  kaleidoscopeRotationSpeed?: number;
  kaleidoscopeParticleDensity?: number;
  kaleidoscopeColorShift?: number;
}
