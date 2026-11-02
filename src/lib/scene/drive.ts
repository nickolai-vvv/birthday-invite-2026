const clamp = (x: number) => Math.max(0, Math.min(1, x));

// Zero lateral velocity and acceleration at both ends of each lane change.
function laneBlend(p: number, start: number, end: number) {
  const t = clamp((p - start) / (end - start));
  return t * t * t * (10 + t * (-15 + 6 * t));
}

function laneDerivative(p: number, start: number, end: number) {
  const t = clamp((p - start) / (end - start));
  return 30 * t * t * (1 - t) * (1 - t) / (end - start);
}

export function driveAt(p: number) {
  const brake = clamp((p - .64) / .08);
  const stop = clamp((p - .80) / .04);
  const distance = p < .64 ? p * 400
    : p < .72 ? 256 + 32 * brake - 12 * brake * brake
    : p < .80 ? 276 + 100 * (p - .72)
    : 284 + 4 * stop - 2 * stop * stop;
  const outward = laneBlend(p, .21, .35);
  const homeward = laneBlend(p, .50, .64);
  const x = 2.25 - 4.5 * (outward - homeward);
  const dx = -4.5 * (laneDerivative(p, .21, .35) - laneDerivative(p, .50, .64));
  const extra = 82.525 * laneBlend(p,.70,.82);
  return {
    x,
    z: 24 - distance - extra,
    distance: distance + extra,
    // The model's forward axis is -Z. Positive yaw points the nose left.
    yaw: Math.atan2(-dx, 400),
    trafficDistance: p < .64 ? p * 260 : 166.4 + 80 * (p - .64),
  };
}



