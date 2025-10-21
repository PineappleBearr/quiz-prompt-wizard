import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  const [yaw, setYaw] = useState([0]);
  const [pitch, setPitch] = useState([0]);

  // Level C state
  const [tValue, setTValue] = useState("");
  const [firstSphereIndex, setFirstSphereIndex] = useState("");
  const [spheresValid, setSpheresValid] = useState("");
  const [hitOrder, setHitOrder] = useState("");
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
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Left Column: Instruction */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-primary text-lg">Instruction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.level === "A" && (
            <>
              <div className="space-y-3 text-sm leading-relaxed">
                <p><strong>Step 1 – Closest distance:</strong> From the picture, compare the closest distance ρ from the ray to the sphere center with the radius <em>r</em>. Pick the relation that holds.</p>
                <p><strong>Step 2 – Discriminant:</strong> From your choice, pick the sign of Δ.</p>
                <p><strong>Step 3 – Consequence & hit:</strong> State what your Δ implies and whether there is a forward hit (t ≥ 0) along +d).</p>
              </div>
              
              <div className="bg-muted/30 p-5 rounded-lg border border-border/50">
                <p className="text-sm mb-3"><strong>Reference (no numeric work required):</strong></p>
                <div className="text-center space-y-2 my-4">
                  <p className="font-serif italic text-base">p(t) = o + t d</p>
                  <p className="font-serif italic text-base">ρ = ||(c − o) − ((c − o) · d) d||</p>
                  <p className="font-serif italic text-base">ρ &gt; r ⇒ Δ &lt; 0;  ρ = r ⇒ Δ = 0;  ρ &lt; r ⇒ Δ &gt; 0</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">Hint: judge visually (closest distance vs radius), then complete Δ and Hit.</p>
              </div>
            </>
          )}

          {question.level === "B" && (
            <>
              <div className="space-y-2 text-sm">
                <p><strong>Analyze – Tangency Hunter</strong></p>
                <p><strong>Required Formulas:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>p(t) = o + t d</li>
                  <li>ρ = ||(c − o) − d||</li>
                  <li>g = ||(c − o) − m ρ||</li>
                  <li>Window: [t] = s ∈ r</li>
                </ul>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-2">
                <p>If p is not exactly at tangent baseline, then fine-tune yaw/pitch.</p>
                <p>Explain how the formulas indicate exact tangency, and describe which variable relationships must hold at tangency.</p>
                <p>Hint: p = x 2.278 | t = 1.248 | |p−c| = 1.024=0.0 (target = 0.001)</p>
              </div>
            </>
          )}

          {question.level === "C" && (
            <>
              <div className="space-y-2 text-sm">
                <p><strong>Evaluate with t-window and four spheres</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Filter out spheres whose all hits fall outside [a,b].</li>
                  <li>Of the remaining, decide which can be hit within [a,b].</li>
                  <li>Determine the first valid hit (sphere id and t), tangent counts as a hit.</li>
                  <li>If two hits are within ε, explain your tie-break according to the policy.</li>
                </ol>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-1">
                <p><strong>Formulas:</strong></p>
                <p>Ray: t ≥ 0</p>
                <p>Projection: m = (c − o) · d</p>
                <p>Perpendicular distance: ρ = ||(c − o) − (m)d|| − m ρ||</p>
                <p>Selection: choose smallest t ∈ [0, tWindow.counts as hit</p>
                <p>Window test: valid iff t ∈ [a,b] within ε</p>
              </div>
            </>
          )}

          <div className="bg-muted/20 p-4 rounded-lg border border-border/30">
            <p className="text-sm font-semibold mb-2">Parameters</p>
            <div className="font-mono text-xs space-y-1">
              <p><strong>o:</strong> [{question.ray.origin.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>d</strong> (unit): [{question.ray.direction.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>c:</strong> [{question.sphere.center.map(v => v.toFixed(2)).join(", ")}]</p>
              <p><strong>r:</strong> {question.sphere.radius.toFixed(2)}</p>
              {question.level === "C" && question.spheres && (
                <>
                  <p className="mt-2"><strong>Window & Policy</strong></p>
                  <p>t-window: [{question.tWindow?.[0].toFixed(3)}, {question.tWindow?.[1].toFixed(3)}]</p>
                  <p>ε (tolerance): {question.tolerance?.toFixed(2)}</p>
                </>
              )}
            </div>
          </div>

          {question.level === "C" && question.spheres && question.spheres.length > 0 && (
            <div className="bg-muted/20 p-4 rounded-lg border border-border/30">
              <p className="text-sm font-semibold mb-2">Spheres (a-d)</p>
              <div className="font-mono text-xs space-y-1">
                {question.spheres.map((sphere, idx) => (
                  <p key={idx}>
                    <strong>{String.fromCharCode(97 + idx)}.</strong> center=[{sphere.center.map(v => v.toFixed(2)).join(", ")}]; r={sphere.radius.toFixed(2)}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted/20 p-4 rounded-lg border border-border/30">
            <p className="text-sm font-semibold mb-2">Glossary (quick meanings)</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li><strong>o:</strong> ray origin (start point)</li>
              <li><strong>d:</strong> ray direction (unit vector)</li>
              <li><strong>c, r:</strong> sphere center and radius</li>
              <li><strong>p(t)=o+td:</strong> point on the ray after distance t along +d</li>
              <li><strong>ρ:</strong> closest distance from c to the ray line</li>
              <li><strong>Δ:</strong> discriminant; its sign decides miss/tangent/two hits</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Visualization + Answer */}
      <div className="space-y-4">
        {/* Visualization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary text-lg">Visualization</CardTitle>
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
            
            {question.level === "B" && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Yaw (±3°)</Label>
                    <span className="text-muted-foreground">{yaw[0]}°</span>
                  </div>
                  <Slider
                    value={yaw}
                    onValueChange={setYaw}
                    min={-3}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Pitch (±3°)</Label>
                    <span className="text-muted-foreground">{pitch[0]}°</span>
                  </div>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    min={-3}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Level A: Basic Analysis */}
            {question.level === "A" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step 1. ρ vs r</Label>
                  <Select value={hit ? "ρ < r" : "ρ > r"} onValueChange={(v) => setHit(v === "ρ < r")}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="ρ < r">ρ &lt; r</SelectItem>
                      <SelectItem value="ρ = r">ρ = r</SelectItem>
                      <SelectItem value="ρ > r">ρ &gt; r</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step 2. Choose the sign of Δ</Label>
                  <Select value={deltaSign === "POS" ? "Δ > 0" : deltaSign === "ZERO" ? "Δ = 0" : "Δ < 0"} 
                          onValueChange={(v) => setDeltaSign(v === "Δ > 0" ? "POS" : v === "Δ = 0" ? "ZERO" : "NEG")}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Δ > 0">Δ &gt; 0</SelectItem>
                      <SelectItem value="Δ = 0">Δ = 0</SelectItem>
                      <SelectItem value="Δ < 0">Δ &lt; 0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step 3a. What does your Δ imply?</Label>
                  <Select defaultValue="two real roots">
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="no real roots">no real roots</SelectItem>
                      <SelectItem value="one real root (tangent)">one real root (tangent)</SelectItem>
                      <SelectItem value="two real roots">two real roots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step 3b. Forward hit in +d (t ≥ 0)?</Label>
                  <Select value={hit ? "Yes — visible forward hit" : "No — miss or behind ray"} 
                          onValueChange={(v) => setHit(v === "Yes — visible forward hit")}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Yes — visible forward hit">Yes — visible forward hit</SelectItem>
                      <SelectItem value="No — miss or behind ray">No — miss or behind ray</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Optional: one-line explanation</Label>
                  <Input
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="e.g. ρ<r ⇒ Δ>0 (two roots); choose smallest t≥0 for the visible hit."
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Tip: [ρ&gt;r, ρ=r, ρ&lt;r] — [Δ&lt;0, Δ=0, Δ&gt;0] — [miss, tangent, two hits]</p>
                </div>
              </>
            )}

            {/* Level B: Tangency Hunter */}
            {question.level === "B" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Explain how you judge exact tangency</Label>
                  <Textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="e.g. when ρ = r within tolerance, there is exactly one (tangent)"
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </>
            )}

            {/* Level C: Multi-sphere */}
            {question.level === "C" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pick spheres valid within [a,b] (comma letters)</Label>
                  <Input
                    value={spheresValid}
                    onChange={(e) => setSpheresValid(e.target.value)}
                    placeholder="e.g. a,c,d"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order of first hits (near → far, comma letters)</Label>
                  <Input
                    value={hitOrder}
                    onChange={(e) => setHitOrder(e.target.value)}
                    placeholder="e.g. c,a,d"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">First valid hit — sphere id</Label>
                    <Input
                      value={firstSphereIndex}
                      onChange={(e) => setFirstSphereIndex(e.target.value)}
                      placeholder="e.g. c"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">First valid hit — t</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tValue}
                      onChange={(e) => setTValue(e.target.value)}
                      placeholder="e.g. 2.14"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">If two hits are within ε, explain your tie-break</Label>
                  <Textarea
                    value={tieJustification}
                    onChange={(e) => setTieJustification(e.target.value)}
                    placeholder="e.g. choose the lower letter id; tangent counts as hit"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </>
            )}

            <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
