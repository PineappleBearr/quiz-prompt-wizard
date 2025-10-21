import { Ray, Sphere, Vec3, RaySphereQuestionData, ReasonCode } from "../types/raySphereTypes";

/* =========================
 * Utilities
 * ========================= */
export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function mulScalar(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}
export function normalizeVec(a: Vec3): Vec3 {
  const len = length(a);
  return len === 0 ? [0, 0, 0] : [a[0] / len, a[1] / len, a[2] / len];
}
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function choice<T>(xs: T[]) { return xs[Math.floor(Math.random() * xs.length)]; }

function randomSphere(): Sphere {
  return {
    center: [rand(-3, 3), rand(-3, 3), rand(-3, 3)],
    radius: rand(0.4, 1.8),
  };
}

/* =========================
 * Numerics & core
 * ========================= */
export const EPS   = 1e-6;   // forward 可见 t 阈值
export const EPS_D = 1e-8;   // Δ≈0 判定

/** 仅计算根（不做窗口过滤），返回升序 roots */
export function raySphereIntersection(ray: Ray, sphere: Sphere): number[] {
  const o = ray.origin;
  const d = ray.direction;
  const c = sphere.center;
  const r = sphere.radius;

  const oc = sub(o, c);
  const a = dot(d, d);
  const b = 2 * dot(oc, d);
  const c_ = dot(oc, oc) - r * r;
  const discriminant = b * b - 4 * a * c_;

  if (discriminant < 0) return [];
  if (Math.abs(discriminant) < EPS_D) {
    const t = -b / (2 * a);
    return [t];
  }
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  return [t1, t2].sort((x, y) => x - y);
}

/** 依据 ε 与 tWindow 统一判定“首个有效命中”与原因 */
export function chooseHitAndReason(
  roots: number[],
  opts: { tWindow?: [number, number]; epsilon?: number; treatTangentAsHit?: boolean } = {}
): { hitT?: number; reason: ReasonCode; deltaCase: "NEG" | "ZERO" | "POS"; roots: number[] } {
  const { tWindow, epsilon = EPS, treatTangentAsHit = true } = opts;

  let deltaCase: "NEG" | "ZERO" | "POS";
  if (roots.length === 0) deltaCase = "NEG";
  else if (roots.length === 1) deltaCase = "ZERO";
  else deltaCase = "POS";

  const forward = roots.filter((t) => t >= epsilon);

  if (deltaCase === "NEG") {
    return { hitT: undefined, reason: "NO_INTERSECTION", deltaCase, roots };
  }

  if (deltaCase === "ZERO") {
    const t0 = roots[0];
    if (t0 < epsilon) return { hitT: undefined, reason: "NEGATIVE_T", deltaCase, roots };
    if (tWindow && (t0 < tWindow[0] || t0 > tWindow[1])) {
      return { hitT: undefined, reason: "OUT_OF_RANGE", deltaCase, roots };
    }
    if (!treatTangentAsHit) return { hitT: undefined, reason: "TANGENT", deltaCase, roots };
    return { hitT: t0, reason: "TANGENT", deltaCase, roots };
  }

  // Δ>0：取最小非负根
  if (forward.length === 0) return { hitT: undefined, reason: "NEGATIVE_T", deltaCase, roots };
  const tHit = forward[0];
  if (tWindow && (tHit < tWindow[0] || tHit > tWindow[1])) {
    return { hitT: undefined, reason: "OUT_OF_RANGE", deltaCase, roots };
  }
  return { hitT: tHit, reason: "OK", deltaCase, roots };
}

/* =========================
 * Geometry helpers (for Analyze: Tangency Hunter)
 * ========================= */

/** m=(c−o)·d；ρ=|| (c−o) − m d || */
export function rhoFor(ray: Ray, sphere: Sphere): { m: number; rho: number } {
  const u = sub(sphere.center, ray.origin); // (c - o)
  const m = dot(u, ray.direction);
  const perp = sub(u, mulScalar(ray.direction, m));
  const rho = length(perp);
  return { m, rho };
}

/** 生成一条“恰为相切”的方向（若 |c−o|<=r，内部点不存在切线，返回 null） */
export function makeTangentDirection(o: Vec3, c: Vec3, r: number, sign: 1 | -1 = 1): Vec3 | null {
  const u = sub(c, o);
  const L = length(u);
  if (L <= r + 1e-9) return null; // inside/on sphere: no external tangent rays
  const uh = normalizeVec(u);
  // 需要 |u - (u·d)d| = r  => L*sinθ = r  -> sinθ=r/L, cosθ=√(1 - (r/L)^2)
  const sinT = r / L;
  const cosT = Math.sqrt(Math.max(0, 1 - sinT * sinT));

  // 构造与 uh 垂直的 e2
  const tmp: Vec3 = Math.abs(uh[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
  const e2 = normalizeVec([
    tmp[1] * uh[2] - tmp[2] * uh[1],
    tmp[2] * uh[0] - tmp[0] * uh[2],
    tmp[0] * uh[1] - tmp[1] * uh[0],
  ]);
  const d = normalizeVec([
    cosT * uh[0] + sign * sinT * e2[0],
    cosT * uh[1] + sign * sinT * e2[1],
    cosT * uh[2] + sign * sinT * e2[2],
  ]);
  return d;
}

/** 对方向做小角度欧拉扰动（度） */
export function perturbDirectionEuler(d: Vec3, yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  // 先绕世界Y（yaw），再绕世界X（pitch）
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);

  // R = Rx * Ry
  const x = d[0], y = d[1], z = d[2];
  const ryx = cy * x + 0 * y + -sy * z;
  const ryy = 0 * x + 1 * y + 0 * z;
  const ryz = sy * x + 0 * y + cy * z;

  const rxx = ryx;
  const rxy = cx * ryy - sx * ryz;
  const rxz = sx * ryy + cx * ryz;

  return normalizeVec([rxx, rxy, rxz]);
}

/* =========================
 * 简洁题面 meta
 * ========================= */
function formatVec(v: Vec3) {
  return `[${v.map((n) => n.toFixed(2)).join(", ")}]`;
}
function getLevelMeta(
  level: "A" | "B" | "C",
  params: { ray: Ray; sphere: Sphere; tWindow?: [number, number]; tolerance: number }
) {
  const { ray, sphere, tWindow, tolerance } = params;
  const paramText = [
    `o = ${formatVec(ray.origin)}`,
    `d = ${formatVec(ray.direction)} (unit)`,
    `c = ${formatVec(sphere.center)}, r = ${sphere.radius.toFixed(2)}`,
  ];
  if (level === "C" && tWindow) {
    paramText.push(`t-window [a,b] = [${tWindow[0].toFixed(3)}, ${tWindow[1].toFixed(3)}], ε = ${tolerance}`);
  }

  if (level === "A") {
    return {
      name: `Ray–Sphere (Level A: Apply)`,
      params: paramText.join("  |  "),
      prompt:
        "Using the picture you see, say why substituting the ray into the sphere yields a quadratic in t here; pick the sign of Δ, and state what that implies.",
    };
  }
  if (level === "B") {
    return {
      name: `Ray–Sphere (Level B: Tangency Hunter)`,
      params: paramText.join("  |  "),
      prompt:
`Analyze (tangency). Required formulas:
• Ray: p(t) = o + t d
• Projection: m = (c − o) · d
• Perpendicular distance: ρ = ‖(c − o) − m d‖
• Tangency iff ρ = r

Hint: use the top button to snap near a tangent baseline, then fine-tune yaw/pitch.
Explain how the formulas indicate exact tangency, and describe which variable relationships must hold at tangency.`,
    };
  }
  return {
    name: `Ray–Sphere (Level C: Evaluate)`,
    params: paramText.join("  |  "),
    prompt:
`Evaluate with t-window and four spheres (a–d).
1) Filter out spheres whose all hits fall outside [a,b].
2) From the remaining, decide which can be hit within [a,b].
3) Determine the first valid hit (sphere id and t), tangent counts as a hit.
4) If two hits are within ε, explain your tie-break according to the policy.`,
  };
}

/* =========================
 * 出题：A/B 单球；C 四球 + 窗口（≥2 可命中）
 * ========================= */
export function generateRaySphereQuestion(level: "A" | "B" | "C" = "A"): RaySphereQuestionData {
  const tolerance = 1e-6;

  if (level !== "C") {
    const center: Vec3 = [rand(-2, 2), rand(-2, 2), rand(-2, 2)];
    const radius = rand(0.6, 1.6);

    let origin: Vec3;
    let direction: Vec3;

    if (Math.random() < 0.75) {
      const offset: Vec3 = [rand(-1, 1), rand(-1, 1), rand(-1, 1)];
      origin = [center[0] + offset[0] * radius * 1.6, center[1] + offset[1] * radius * 1.6, center[2] + offset[2] * radius * 1.6];
      const toC = [center[0] - origin[0] + rand(-0.2, 0.2), center[1] - origin[1] + rand(-0.2, 0.2), center[2] - origin[2] + rand(-0.2, 0.2)] as Vec3;
      direction = normalizeVec(toC);
    } else {
      origin = [rand(-2, 2), rand(-2, 2), rand(-2, 2)];
      direction = normalizeVec([rand(-1, 1), rand(-1, 1), rand(-1, 1)]);
    }

    const tWindow = undefined;
    const meta = getLevelMeta(level, { ray: { origin, direction }, sphere: { center, radius }, tWindow, tolerance });

    return {
      ray: { origin, direction },
      sphere: { center, radius },
      level,
      tolerance,
      tWindow,
      meta,
    };
  }

  // —— C：四球 + 窗口 + 策略 —— //
  const ray: Ray = {
    origin: [rand(-2, 2), rand(-2, 2), rand(-2, 2)] as Vec3,
    direction: normalizeVec([rand(-2, 2), rand(-2, 2), rand(-2, 2)] as Vec3),
  };
  const count = 4; // 固定四个球
  const spheres: Sphere[] = Array.from({ length: count }, () => randomSphere());

  const a = choice([0, 0.1, 0.2, 0.4, 0.6]);
  const b = a + choice([2, 3, 4]);
  const policy = {
    tWindow: [a, b] as [number, number],
    epsilon: tolerance,
    tangentCountsAsHit: true,
    firstHitWins: true,
  };

  // 质量控制：至少两个“前向可命中”，并且窗口内至少一个
  let attempts = 0;
  const okForwardAtLeast2 = () => {
    let forward = 0;
    for (const s of spheres) {
      const t = firstPositiveHitT(ray, s, tolerance);
      if (t !== undefined) forward++;
    }
    return forward >= 2;
  };
  const okHasInWindow = () =>
    spheres.some((s) => {
      const { hitT } = chooseHitAndReason(raySphereIntersection(ray, s), {
        tWindow: policy.tWindow, epsilon: policy.epsilon, treatTangentAsHit: policy.tangentCountsAsHit,
      });
      return hitT !== undefined;
    });

  while (attempts < 100 && (!okForwardAtLeast2() || !okHasInWindow())) {
    for (let i = 0; i < spheres.length; i++) spheres[i] = randomSphere();
    attempts++;
  }

  const meta = getLevelMeta("C", { ray, sphere: spheres[0], tWindow: policy.tWindow, tolerance });

  return {
    ray,
    sphere: spheres[0],
    spheres,
    policy,
    level: "C",
    tolerance,
    tWindow: policy.tWindow,
    meta,
  } as any;
}

/* =========================
 * 多球 & 小工具
 * ========================= */
export function firstPositiveHitT(ray: Ray, sphere: Sphere, eps = EPS): number | undefined {
  const roots = raySphereIntersection(ray, sphere);
  const t = roots.find((v) => v >= eps);
  return t === undefined ? undefined : t;
}

export function segmentHitsSphere(ray: Ray, sphere: Sphere, x: number, eps = EPS): boolean {
  const t = firstPositiveHitT(ray, sphere, eps);
  return t !== undefined && t <= x + eps;
}

export interface MultiHit {
  sphereIndex: number;
  t: number;
  reason: "OK" | "TANGENT";
  tieWith?: number[];
}

export function firstValidHitMulti(
  ray: Ray,
  spheres: Sphere[],
  policy: { tWindow?: [number, number]; epsilon: number; tangentCountsAsHit: boolean; firstHitWins?: boolean }
): MultiHit | undefined {
  const eps = policy.epsilon ?? EPS;
  let best: MultiHit | undefined;
  let ties: number[] = [];

  for (let i = 0; i < spheres.length; i++) {
    const t = firstPositiveHitT(ray, spheres[i], eps);
    if (t === undefined) continue;
    if (policy.tWindow && (t < policy.tWindow[0] - eps || t > policy.tWindow[1] + eps)) continue;

    const roots = raySphereIntersection(ray, spheres[i]);
    const reason = (roots.length === 1) ? "TANGENT" : "OK";
    if (reason === "TANGENT" && !policy.tangentCountsAsHit) continue;

    if (!best) {
      best = { sphereIndex: i, t, reason };
      ties = [];
    } else {
      const diff = Math.abs(t - best.t);
      if (t < best.t - eps) {
        best = { sphereIndex: i, t, reason };
        ties = [];
      } else if (diff <= eps) {
        ties.push(i);
      }
    }
  }
  if (best && ties.length > 0) best.tieWith = ties;
  return best;
}
