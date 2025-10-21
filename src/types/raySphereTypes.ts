export type Vec3 = [number, number, number];

export interface Ray { 
  origin: Vec3; 
  direction: Vec3; // direction should be normalized
}

export interface Sphere { 
  center: Vec3; 
  radius: number; 
}

export type ReasonCode = "NO_INTERSECTION" | "NEGATIVE_T" | "OUT_OF_RANGE" | "TANGENT" | "OK";

// Level A: sign of the discriminant Δ
export type DeltaSign = "NEG" | "ZERO" | "POS";

// Level B: branch code — no real roots / tangent / two roots / negative t / OK
export type BranchCode = "DELTA_LT_0" | "TANGENT" | "TWO_ROOTS" | "NEGATIVE_T" | "OK";

export interface RaySphereQuestionData {
  ray: Ray;
  sphere: Sphere;
  level: "A" | "B" | "C";
  tolerance: number;
  tWindow?: [number, number];
  meta?: any;

  bVariant?: "segment-x";
  cVariant?: "multi-sphere";
  spheres?: Sphere[];
  policy?: {
    tWindow?: [number, number];
    epsilon: number;
    tangentCountsAsHit: boolean;
    firstHitWins?: boolean;
  };
}

export interface RaySphereGradingResult {
  result: "correct" | "partial" | "incorrect";
  score: number;
  checks: {
    b_segment?: {
      x_to_check_hit_expected: boolean;
      x_to_check_hit_student: boolean;
      threshold_expected: number | null;
      threshold_student: number | null;
      pass: boolean;
    };
    c_multi?: {
      first_index_expected: number | null;
      first_index_student: number | null;
      t_expected: number | null;
      t_student_within_tol: boolean;
      tie_exists: boolean;
      justification_ok: boolean;
    };
    [key: string]: any;
  };
  reason_code: ReasonCode | "UNSUPPORTED_LEVEL" | "MISMATCH_SELECTION";
  expected?: RaySphereStudentAnswer;
}

export interface RaySphereStudentAnswer {
  // Level A:
  deltaSign?: DeltaSign;
  hit?: boolean;

  // Level B:
  branch?: BranchCode;
  xToCheck?: number;
  xThreshold?: number | null;
  explanation?: string;

  // Level C:
  t?: number;
  reasonCode?: ReasonCode;
  firstSphereIndex?: number;
  tieBreakJustification?: string;
  evaluationExplanation?: string;
}
