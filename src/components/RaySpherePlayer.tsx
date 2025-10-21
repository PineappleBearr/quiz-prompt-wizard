import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { RaySphereVisualizer } from "./RaySphereVisualizer";
import { 
  RaySphereQuestionData, 
  RaySphereStudentAnswer, 
  DeltaSign, 
  BranchCode 
} from "@/types/raySphereTypes";
import { gradeRaySphere } from "@/utils/raySphereGrading";
import { 
  raySphereIntersection, 
  chooseHitAndReason,
  EPS
} from "@/utils/raySphere";
import { toast } from "sonner";

interface RaySpherePlayerProps {
  question: RaySphereQuestionData;
  onSubmit?: (result: any) => void;
}

const DELTA_SIGN_OPTIONS: { value: DeltaSign; label: string }[] = [
  { value: "NEG", label: "Δ < 0" },
  { value: "ZERO", label: "Δ = 0" },
  { value: "POS", label: "Δ > 0" },
];

const BRANCH_OPTIONS: { value: BranchCode; label: string }[] = [
  { value: "DELTA_LT_0", label: "No real roots (Δ < 0)" },
  { value: "TANGENT", label: "Tangent (Δ = 0)" },
  { value: "TWO_ROOTS", label: "Two roots (Δ > 0)" },
  { value: "NEGATIVE_T", label: "Negative t (behind ray)" },
  { value: "OK", label: "Valid hit found" },
];

export const RaySpherePlayer = ({ question, onSubmit }: RaySpherePlayerProps) => {
  // Level A state
  const [deltaSign, setDeltaSign] = useState<DeltaSign>("POS");
  const [hit, setHit] = useState<boolean>(true);
  const [explanation, setExplanation] = useState("");

  // Level B state
  const [branch, setBranch] = useState<BranchCode>("OK");
  const [xToCheck, setXToCheck] = useState("");
  const [xThreshold, setXThreshold] = useState("");

  // Level C state
  const [tValue, setTValue] = useState("");
  const [firstSphereIndex, setFirstSphereIndex] = useState("");
  const [tieJustification, setTieJustification] = useState("");

  const handleSubmit = () => {
    const answer: RaySphereStudentAnswer = {};

    if (question.level === "A") {
      answer.deltaSign = deltaSign;
      answer.hit = hit;
      answer.explanation = explanation;
    } else if (question.level === "B") {
      answer.branch = branch;
      answer.xToCheck = xToCheck ? parseFloat(xToCheck) : undefined;
      answer.xThreshold = xThreshold ? parseFloat(xThreshold) : null;
      answer.explanation = explanation;
    } else if (question.level === "C") {
      answer.t = tValue ? parseFloat(tValue) : undefined;
      answer.firstSphereIndex = firstSphereIndex ? parseInt(firstSphereIndex) : undefined;
      answer.tieBreakJustification = tieJustification;
    }

    const result = gradeRaySphere(question, answer);
    
    if (result.result === "correct") {
      toast.success("Correct! Well done!");
    } else if (result.result === "partial") {
      toast.warning(`Partially correct. Score: ${(result.score * 100).toFixed(0)}%`);
    } else {
      toast.error("Incorrect. Please review your answer.");
    }

    onSubmit?.(result);
  };

  // Calculate reference answer for visualization
  const roots = raySphereIntersection(question.ray, question.sphere);
  const { hitT } = chooseHitAndReason(roots, {
    tWindow: question.tWindow,
    epsilon: Math.max(question.tolerance, EPS),
    treatTangentAsHit: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ray-Sphere Intersection - Level {question.level}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tier {question.level === "A" ? "1-2" : question.level === "B" ? "3" : "4"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visualization */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <RaySphereVisualizer
              ray={question.ray}
              sphere={question.sphere}
              intersectionT={hitT}
              showIntersection={true}
              showTLabels={true}
              extraSpheres={question.spheres || []}
            />
          </div>

          {/* Question Parameters */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg text-sm font-mono">
            <div>
              <strong>Ray Origin:</strong> [{question.ray.origin.map(v => v.toFixed(2)).join(", ")}]
            </div>
            <div>
              <strong>Ray Direction:</strong> [{question.ray.direction.map(v => v.toFixed(2)).join(", ")}]
            </div>
            <div>
              <strong>Sphere Center:</strong> [{question.sphere.center.map(v => v.toFixed(2)).join(", ")}]
            </div>
            <div>
              <strong>Sphere Radius:</strong> {question.sphere.radius.toFixed(2)}
            </div>
          </div>

          {/* Level A: Basic Analysis */}
          {question.level === "A" && (
            <div className="space-y-4">
              <div>
                <Label>Discriminant Sign (Δ)</Label>
                <RadioGroup value={deltaSign} onValueChange={(v) => setDeltaSign(v as DeltaSign)}>
                  {DELTA_SIGN_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`delta-${opt.value}`} />
                      <Label htmlFor={`delta-${opt.value}`}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Does the ray hit the sphere? (t ≥ 0)</Label>
                <RadioGroup value={hit ? "yes" : "no"} onValueChange={(v) => setHit(v === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="hit-yes" />
                    <Label htmlFor="hit-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="hit-no" />
                    <Label htmlFor="hit-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Explanation (Optional)</Label>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain your reasoning..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Level B: Tangency Hunter */}
          {question.level === "B" && (
            <div className="space-y-4">
              <div>
                <Label>Branch Code</Label>
                <RadioGroup value={branch} onValueChange={(v) => setBranch(v as BranchCode)}>
                  {BRANCH_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`branch-${opt.value}`} />
                      <Label htmlFor={`branch-${opt.value}`}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>x to Check</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={xToCheck}
                  onChange={(e) => setXToCheck(e.target.value)}
                  placeholder="Enter x value..."
                />
              </div>

              <div>
                <Label>x* Threshold (leave empty if no hit)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={xThreshold}
                  onChange={(e) => setXThreshold(e.target.value)}
                  placeholder="Enter threshold..."
                />
              </div>

              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain your analysis..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Level C: Multi-sphere */}
          {question.level === "C" && (
            <div className="space-y-4">
              <div>
                <Label>Hit t Value</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={tValue}
                  onChange={(e) => setTValue(e.target.value)}
                  placeholder="Enter t value..."
                />
              </div>

              <div>
                <Label>First Sphere Index (0-based)</Label>
                <Input
                  type="number"
                  value={firstSphereIndex}
                  onChange={(e) => setFirstSphereIndex(e.target.value)}
                  placeholder="Enter sphere index..."
                />
              </div>

              <div>
                <Label>Tie-break Justification (if applicable)</Label>
                <Textarea
                  value={tieJustification}
                  onChange={(e) => setTieJustification(e.target.value)}
                  placeholder="Explain tie-breaking logic..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Submit Answer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
