// File: src/components/visualizers/flowfieldPatterns/renderRays.ts

import type { FlowFieldPatternContext } from "./types";

export function renderRays(
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
): void {
  const ctx = p.ctx;
  const twoPi = p.TWO_PI;
  const baseRayCount = p.rayCount ?? 60;
  const countScale = 0.65 + audioIntensity * 0.55 + bassIntensity * 0.55;
  let rayCount = (baseRayCount * countScale) | 0;
  if (rayCount < 24) rayCount = 24;
  if (rayCount > 120) rayCount = 120;
  const invRayCount = 1 / rayCount;
  const angleStep = twoPi * invRayCount;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(p.centerX, p.centerY);
  ctx.lineCap = "round";

  const timeWave1 = p.time * 0.001;
  const timeWave2 = p.time * 0.01;
  const timeWave3 = p.time * 0.005;
  const timeHue = p.time * 0.05;
  const minDimension = Math.min(p.width, p.height);

  const rayLengthBase = minDimension * (0.55 + audioIntensity * 0.55);
  const rayWidth = 2.5 + trebleIntensity * 5.5;
  const hueStep = 360 * invRayCount;
  const alpha = 0.4 + audioIntensity * 0.45;

  const rayData: Array<{ endX: number; endY: number; hue: number }> = [];

  for (let i = 0; i < rayCount; i++) {
    const spiralAngle = timeWave1 + i * 0.1;
    const pulseAngle = timeWave2 + i * 0.2;
    const angle = angleStep * i + timeWave3 + p.fastSin(spiralAngle) * 0.18;
    const pulseEffect = 1 + p.fastSin(pulseAngle) * 0.12;
    const rayLength = rayLengthBase * pulseEffect;

    const endX = p.fastCos(angle) * rayLength;
    const endY = p.fastSin(angle) * rayLength;
    const hue = p.fastMod360(p.hueBase + i * hueStep + timeHue);

    rayData.push({ endX, endY, hue });
  }

  ctx.shadowBlur = 0;
  ctx.lineWidth = rayWidth;

  for (let i = 0; i < rayCount; i++) {
    const { endX, endY, hue } = rayData[i]!;
    ctx.strokeStyle = p.hsla(hue, 95, 65, alpha);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  const glowRadius = 90 + bassIntensity * 110;
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
  glowGradient.addColorStop(
    0,
    p.hsla(p.hueBase, 100, 80, 0.35 + audioIntensity * 0.25),
  );
  glowGradient.addColorStop(
    0.55,
    p.hsla(p.hueBase, 90, 60, 0.18 + audioIntensity * 0.15),
  );
  glowGradient.addColorStop(1, p.hsla(p.hueBase, 80, 40, 0));

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius, 0, twoPi);
  ctx.fill();

  ctx.restore();
}
