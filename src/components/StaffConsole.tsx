import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSeed } from "@/utils/rng";
import { generateQuestion } from "@/utils/questionGenerator";
import { Question } from "@/types/question";
import { toast } from "sonner";
import { emitQuestionGenerated } from "@/pages/Index";

export const StaffConsole = () => {
  const [examKey, setExamKey] = useState("S2025|E3|slot1");
  const [studentId, setStudentId] = useState("stu:12345");
  const [questionType, setQuestionType] = useState("transform_mcq");
  const [tier, setTier] = useState("1");
  const [count, setCount] = useState("1");
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const questions: Question[] = [];
      const numQuestions = parseInt(count);
      
      for (let i = 0; i < numQuestions; i++) {
        const seed = await generateSeed(examKey, studentId, i, questionType, parseInt(tier));
        const question = generateQuestion(seed, questionType, parseInt(tier), i);
        questions.push(question);
      }
      
      setGeneratedQuestions(questions);
      emitQuestionGenerated(questions);
      toast.success(`Generated ${numQuestions} question(s)`);
    } catch (error) {
      toast.error("Failed to generate questions");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(generatedQuestions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exam_${examKey}_${studentId}.json`;
    link.click();
    toast.success("Exported questions as JSON");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CG ExamGen Staff Console</h1>
          <p className="text-muted-foreground">Configure and generate exam questions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation Controls</CardTitle>
          <CardDescription>Configure exam parameters and generate questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examKey">Exam Key</Label>
              <Input 
                id="examKey" 
                value={examKey} 
                onChange={(e) => setExamKey(e.target.value)}
                placeholder="S2025|E3|slot1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input 
                id="studentId" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="stu:12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Question Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transform_mcq">Transformation Sequence</SelectItem>
                  <SelectItem value="code_picture">Code to Picture</SelectItem>
                  <SelectItem value="stack_reasoning">Stack Reasoning</SelectItem>
                  <SelectItem value="code_input">Code Input Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Difficulty Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1 (Single-move)</SelectItem>
                  <SelectItem value="2">Tier 2 (Two-step)</SelectItem>
                  <SelectItem value="3">Tier 3 (Pivoted)</SelectItem>
                  <SelectItem value="4">Tier 4 (Sequence)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Count</Label>
              <Input 
                id="count" 
                type="number" 
                min="1" 
                max="10" 
                value={count} 
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
              {isGenerating ? "Generating..." : "Generate Questions"}
            </Button>
            <Button 
              onClick={handleExport} 
              variant="outline" 
              disabled={generatedQuestions.length === 0}
            >
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions Preview</CardTitle>
            <CardDescription>
              {generatedQuestions.length} question(s) generated with seed-based determinism
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{q.questionId}</p>
                    <p className="text-sm text-muted-foreground">
                      Tier {q.tier} | Family: {q.family}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Seed: {q.seed.substring(0, 12)}...</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Canonical sequence:</p>
                  <code className="text-xs bg-codeBg p-2 rounded block overflow-x-auto">
                    {q.variant.sequence.map((t, i) => {
                      if (t.type === "translate") {
                        return `glTranslatef(${t.params.join(", ")})`;
                      } else {
                        return `glRotatef(${t.params.join(", ")})`;
                      }
                    }).join(";\n")}
                  </code>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
