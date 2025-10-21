import {
    RaySphereQuestionData,
    RaySphereStudentAnswer,
    RaySphereGradingResult,
    ReasonCode,
    DeltaSign,
    BranchCode,
} from "../types/raySphereTypes";
import { raySphereIntersection, chooseHitAndReason, EPS, firstPositiveHitT, segmentHitsSphere, firstValidHitMulti } from "./raySphere";

// Helper: compare numbers with tolerance
function nearlyEqual(a: number, b: number, tol: number) {
    return Math.abs(a - b) <= tol;
}

function deltaCaseToSign(deltaCase: "NEG" | "ZERO" | "POS"): DeltaSign {
    return deltaCase; // identical mapping
}

// Infer expected branch for Level B from discriminant case and hitT
function expectedBranchFrom(deltaCase: "NEG" | "ZERO" | "POS", hitT?: number): BranchCode {
    if (deltaCase === "NEG") return "DELTA_LT_0";
    if (deltaCase === "ZERO") return "TANGENT";
    // POS
    if (hitT === undefined) return "NEGATIVE_T"; // both roots behind origin
    return "OK"; // valid hit: choose smallest positive root
}

function explanationHasKeywords(text: string | undefined, keywords: string[]): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
}

export function gradeRaySphere(
    q: RaySphereQuestionData,
    student: RaySphereStudentAnswer
): RaySphereGradingResult {
    const { ray, sphere, level, tolerance, tWindow, bVariant, cVariant, spheres, policy } = q;

    if (level === "B" && bVariant === "segment-x") {
        const tHit = firstPositiveHitT(ray, sphere, tolerance);
        const xStar = tHit ?? null;
        const xToCheck = student.xToCheck;
        const xThreshold = student.xThreshold ?? null;

        const xToCheckExpectedHit = (xToCheck !== undefined && tHit !== undefined)
            ? tHit <= xToCheck + tolerance
            : false;
        const xToCheckStudent = (xToCheck !== undefined && student.xToCheck !== undefined)
            ? tHit !== undefined && tHit <= xToCheck + tolerance
            : false;

        let xThresholdPass = false;
        if (xStar === null) {
            xThresholdPass = (xThreshold === null || xThreshold === undefined);
        } else if (xThreshold !== null && xThreshold !== undefined && typeof xThreshold === 'number') {
            xThresholdPass = nearlyEqual(xThreshold, xStar, tolerance);
        }

        const branchExpected = expectedBranchFrom(
            tHit === undefined
                ? (raySphereIntersection(ray, sphere).length === 1 ? "ZERO" : "NEG")
                : "POS",
            tHit
        );
        const branchPass = student.branch === branchExpected;

        // Scoring
        let score = 0;
        if (branchPass) score += 0.3;
        if (xToCheckExpectedHit === xToCheckStudent) score += 0.3;
        if (xThresholdPass) score += 0.4;
        let result: "correct" | "partial" | "incorrect" = score === 1 ? "correct" : score > 0 ? "partial" : "incorrect";

        return {
            result,
            score,
            checks: {
                b_segment: {
                    x_to_check_hit_expected: xToCheckExpectedHit,
                    x_to_check_hit_student: xToCheckStudent,
                    threshold_expected: xStar,
                    threshold_student: xThreshold ?? null,
                    pass: score === 1,
                },
            },
            reason_code: result === "correct" ? "OK" : "MISMATCH_SELECTION",
            expected: {
                branch: branchExpected,
                xToCheck: xToCheck,
                xThreshold: xStar,
            },
        };
    }

    if (level === "C" && cVariant === "multi-sphere" && spheres && spheres.length > 1) {
        const pol = policy ?? { tWindow, epsilon: tolerance, tangentCountsAsHit: true, firstHitWins: true };
        const best = firstValidHitMulti(ray, spheres, pol);
        const first_index_expected = best?.sphereIndex ?? null;
        const t_expected = best?.t ?? null;
        const tie_exists = !!best?.tieWith && best.tieWith.length > 0;

        const first_index_student = student.firstSphereIndex ?? null;
        const t_student = student.t ?? null;
        const t_student_within_tol = t_expected !== null && t_student !== null
            ? nearlyEqual(t_student, t_expected, pol.epsilon)
            : false;

        let justification_ok = true;
        if (tie_exists) {
            justification_ok = !!student.tieBreakJustification && (
                student.tieBreakJustification.toLowerCase().includes("first") ||
                student.tieBreakJustification.toLowerCase().includes("index")
            );
        }

        // Scoring
        let score = 0;
        if (first_index_student === first_index_expected) score += 0.5;
        if (t_student_within_tol) score += 0.3;
        if (tie_exists && justification_ok) score += 0.2;
        if (!tie_exists) score = Math.min(score, 0.8);

        let result: "correct" | "partial" | "incorrect" = score === 1 ? "correct" : score > 0 ? "partial" : "incorrect";

        return {
            result,
            score,
            checks: {
                c_multi: {
                    first_index_expected,
                    first_index_student,
                    t_expected,
                    t_student_within_tol,
                    tie_exists,
                    justification_ok,
                },
            },
            reason_code: result === "correct" ? "OK" : "MISMATCH_SELECTION",
            expected: {
                firstSphereIndex: first_index_expected,
                t: t_expected,
            },
        };
    }

    // Level B: explanation check
    if (q.level === "B") {
        const tHit = firstPositiveHitT(ray, sphere, tolerance);
        const xStar = tHit ?? null;
        const xToCheck = student.xToCheck;
        const xThreshold = student.xThreshold ?? null;

        const xToCheckExpectedHit = (xToCheck !== undefined && tHit !== undefined)
            ? tHit <= xToCheck + tolerance
            : false;
        const xToCheckStudent = (xToCheck !== undefined && student.xToCheck !== undefined)
            ? tHit !== undefined && tHit <= xToCheck + tolerance
            : false;

        let xThresholdPass = false;
        if (xStar === null) {
            xThresholdPass = (xThreshold === null || xThreshold === undefined);
        } else if (xThreshold !== null && xThreshold !== undefined && typeof xThreshold === 'number') {
            xThresholdPass = nearlyEqual(xThreshold, xStar, tolerance);
        }

        const branchExpected = expectedBranchFrom(
            tHit === undefined
                ? (raySphereIntersection(ray, sphere).length === 1 ? "ZERO" : "NEG")
                : "POS",
            tHit
        );
        const branchPass = student.branch === branchExpected;

        // Scoring
        let score = 0;
        if (branchPass) score += 0.3;
        if (xToCheckExpectedHit === xToCheckStudent) score += 0.3;
        if (xThresholdPass) score += 0.4;
        let result: "correct" | "partial" | "incorrect" = score === 1 ? "correct" : score > 0 ? "partial" : "incorrect";

        const explanationOk = explanationHasKeywords(student.explanation, [
            "ray", "sphere", "intersection", "root", "positive", "negative", "tangent", "geometry"
        ]);
        if (explanationOk) score += 0.2;

        return {
            result,
            score,
            checks: {
                b_segment: {
                    x_to_check_hit_expected: xToCheckExpectedHit,
                    x_to_check_hit_student: xToCheckStudent,
                    threshold_expected: xStar,
                    threshold_student: xThreshold ?? null,
                    pass: score === 1,
                } as any,
                explanationOk: {
                    pass: explanationOk,
                },
            },
            reason_code: result === "correct" ? "OK" : "MISMATCH_SELECTION",
            expected: {
                branch: branchExpected,
                xToCheck: xToCheck,
                xThreshold: xStar,
            },
        };
    }

    // Level C: evaluationExplanation check
    if (q.level === "C") {
        const pol = policy ?? { tWindow, epsilon: tolerance, tangentCountsAsHit: true, firstHitWins: true };
        const best = firstValidHitMulti(ray, spheres, pol);
        const first_index_expected = best?.sphereIndex ?? null;
        const t_expected = best?.t ?? null;
        const tie_exists = !!best?.tieWith && best.tieWith.length > 0;

        const first_index_student = student.firstSphereIndex ?? null;
        const t_student = student.t ?? null;
        const t_student_within_tol = t_expected !== null && t_student !== null
            ? nearlyEqual(t_student, t_expected, pol.epsilon)
            : false;

        let justification_ok = true;
        if (tie_exists) {
            justification_ok = !!student.tieBreakJustification && (
                student.tieBreakJustification.toLowerCase().includes("first") ||
                student.tieBreakJustification.toLowerCase().includes("index")
            );
        }

        // Scoring
        let score = 0;
        if (first_index_student === first_index_expected) score += 0.5;
        if (t_student_within_tol) score += 0.3;
        if (tie_exists && justification_ok) score += 0.2;
        if (!tie_exists) score = Math.min(score, 0.8);

        let result: "correct" | "partial" | "incorrect" = score === 1 ? "correct" : score > 0 ? "partial" : "incorrect";

        const evalOk = explanationHasKeywords(student.evaluationExplanation, [
            "first", "index", "policy", "tie", "tangent", "window"
        ]);
        if (evalOk) score += 0.2;

        return {
            result,
            score,
            checks: {
                c_multi: {
                    first_index_expected,
                    first_index_student,
                    t_expected,
                    t_student_within_tol,
                    tie_exists,
                    justification_ok,
                },
                evaluationExplanationOk: {
                    pass: evalOk,
                },
            },
            reason_code: result === "correct" ? "OK" : "MISMATCH_SELECTION",
            expected: {
                firstSphereIndex: first_index_expected,
                t: t_expected,
            },
        };
    }

    // ...A层和其它逻辑保持原样...
    // TODO: Implement grading logic and return a RaySphereGradingResult
    // Placeholder return to ensure valid TypeScript
    return {
        result: "incorrect",
        score: 0,
        checks: {},
        reason_code: "UNSUPPORTED_LEVEL",
        expected: undefined,
    };
}
