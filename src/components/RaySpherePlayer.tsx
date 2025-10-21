import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="space-y-4">
      {/* Instruction Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Instruction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.level === "A" && (
            <>
              <div className="space-y-2 text-sm">
                <p><strong>Step 1 – Closest distance:</strong> From the picture, compare the closest distance ρ from the ray to the sphere center with the radius r. Pick one that holds.</p>
                <p><strong>Step 2 – Discriminant:</strong> From your choice, pick the sign of Δ.</p>
                <p><strong>Step 3 – Consequence & hit:</strong> State what your Δ implies and whether there is a forward hit (t ≥ 0) along +d.</p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2"><strong>Reference (no numeric work required):</strong></p>
                <div className="font-mono text-sm space-y-1">
                  <p>p(t) = o + t d</p>
                  <p>ρ = ||(c - o) - ((c - o) · d) d||</p>
                  <p>ρ &gt; r ⇒ Δ &lt; 0; ρ = r ⇒ Δ = 0; ρ &lt; r ⇒ Δ &gt; 0</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Hint: judge visually (closest distance vs radius), then complete Δ and Hit.</p>
              </div>
            </>
          )}

          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Parameters</p>
            <div className="font-mono text-xs space-y-1">
              <p><strong>o:</strong> [{question.ray.origin.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>d</strong> (unit): [{question.ray.direction.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>c:</strong> [{question.sphere.center.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>r:</strong> {question.sphere.radius.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Glossary (quick meanings)</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li><strong>o:</strong> ray origin (start point)</li>
              <li><strong>d:</strong> ray direction (unit vector)</li>
              <li><strong>c:</strong> sphere center and radius</li>
              <li><strong>p(t)=o+td:</strong> point on the ray after distance t along +d</li>
              <li><strong>ρ:</strong> closest distance from c to the ray line</li>
              <li><strong>Δ:</strong> discriminant; its sign decides miss/tangent/two hits</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Visualization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <RaySphereVisualizer
            ray={question.ray}
            sphere={question.sphere}
            intersectionT={hitT}
            showIntersection={true}
            showTLabels={true}
            extraSpheres={question.spheres || []}
          />
        </CardContent>
      </Card>

      {/* Answer Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Level A: Basic Analysis */}
          {question.level === "A" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Step 1. ρ vs r</Label>
                <Select value={hit ? "ρ < r" : "ρ > r"} onValueChange={(v) => setHit(v === "ρ < r")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ρ < r">ρ &lt; r</SelectItem>
                    <SelectItem value="ρ = r">ρ = r</SelectItem>
                    <SelectItem value="ρ > r">ρ &gt; r</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Step 2. Choose the sign of Δ</Label>
                <Select value={deltaSign === "POS" ? "Δ > 0" : deltaSign === "ZERO" ? "Δ = 0" : "Δ < 0"} 
                        onValueChange={(v) => setDeltaSign(v === "Δ > 0" ? "POS" : v === "Δ = 0" ? "ZERO" : "NEG")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Δ > 0">Δ &gt; 0</SelectItem>
                    <SelectItem value="Δ = 0">Δ = 0</SelectItem>
                    <SelectItem value="Δ < 0">Δ &lt; 0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Step 3a. What does your Δ imply?</Label>
                <Select defaultValue="two real roots">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no real roots">no real roots</SelectItem>
                    <SelectItem value="one real root (tangent)">one real root (tangent)</SelectItem>
                    <SelectItem value="two real roots">two real roots</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Step 3b. Forward hit in +d (t ≥ 0)?</Label>
                <Select value={hit ? "Yes — visible forward hit" : "No — miss or behind ray"} 
                        onValueChange={(v) => setHit(v === "Yes — visible forward hit")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes — visible forward hit">Yes — visible forward hit</SelectItem>
                    <SelectItem value="No — miss or behind ray">No — miss or behind ray</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Optional: one-line explanation</Label>
                <Input
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="e.g. ρ<r ⇒ Δ>0 (two roots); choose smallest t≥0 for the visible hit."
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Level B: Tangency Hunter */}
          {question.level === "B" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Select value={branch} onValueChange={(v) => setBranch(v as BranchCode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELTA_LT_0">No real roots (Δ &lt; 0)</SelectItem>
                    <SelectItem value="TANGENT">Tangent (Δ = 0)</SelectItem>
                    <SelectItem value="TWO_ROOTS">Two roots (Δ &gt; 0)</SelectItem>
                    <SelectItem value="NEGATIVE_T">Negative t (behind ray)</SelectItem>
                    <SelectItem value="OK">Valid hit found</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>x to Check</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={xToCheck}
                  onChange={(e) => setXToCheck(e.target.value)}
                  placeholder="Enter x value..."
                />
              </div>

              <div className="space-y-2">
                <Label>x* Threshold (leave empty if no hit)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={xThreshold}
                  onChange={(e) => setXThreshold(e.target.value)}
                  placeholder="Enter threshold..."
                />
              </div>

              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Hit t Value</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={tValue}
                  onChange={(e) => setTValue(e.target.value)}
                  placeholder="Enter t value..."
                />
              </div>

              <div className="space-y-2">
                <Label>First Sphere Index (0-based)</Label>
                <Input
                  type="number"
                  value={firstSphereIndex}
                  onChange={(e) => setFirstSphereIndex(e.target.value)}
                  placeholder="Enter sphere index..."
                />
              </div>

              <div className="space-y-2">
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
            Submit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
