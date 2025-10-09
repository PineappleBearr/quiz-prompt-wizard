import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ThreeScene } from "./ThreeScene";
import { Question, Transform } from "@/types/question";
import { toast } from "sonner";
import { Maximize2 } from "lucide-react";
import { parseOpenGLCode, compareTransforms } from "@/utils/codeParser";

interface StudentPlayerProps {
  question: Question;
  currentIndex?: number;
  totalQuestions?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: (answer: number) => void;
}

export const StudentPlayer = ({ 
  question, 
  currentIndex = 0, 
  totalQuestions = 1, 
  onNext, 
  onPrev, 
  onSubmit 
}: StudentPlayerProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [codeInput, setCodeInput] = useState<string>("");
  const [currentTransforms, setCurrentTransforms] = useState<Transform[]>([]);
  const [enlargedViz, setEnlargedViz] = useState<{
    transforms: Transform[];
    shape: string;
    showInitialState?: boolean;
    showMultipleInstances?: boolean;
    numInstances?: number;
  } | null>(null);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setCodeInput("");
    setCurrentTransforms([]);
  }, [question.questionId]);

  const handleSubmit = () => {
    if (question.type === "code_input") {
      // Q7: Check if code input matches target
      if (!question.targetSequence) return;
      
      const isCorrect = compareTransforms(currentTransforms, question.targetSequence);
      
      if (isCorrect) {
        toast.success("Correct! Your code produces the target result!");
      } else {
        toast.error("Incorrect. The transformation doesn't match the target.");
      }
      
      onSubmit?.(isCorrect ? 0 : -1);
    } else {
      // Q4, Q5, Q6: Multiple choice
      if (selectedAnswer === null) return;
      const isCorrect = selectedAnswer === question.correctIndex;
      
      if (isCorrect) {
        toast.success("Correct! Well done!");
      } else {
        toast.error(`Incorrect. The correct answer was option ${String.fromCharCode(65 + question.correctIndex)}`);
      }
      
      onSubmit?.(selectedAnswer);
    }
  };

  // Handle code input changes and parse in real-time
  const handleCodeChange = (code: string) => {
    setCodeInput(code);
    try {
      const parsed = parseOpenGLCode(code);
      setCurrentTransforms(parsed);
    } catch (e) {
      // Invalid code, keep previous state
      console.log("Parse error:", e);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {question.type === "code_picture" ? "Quiz 5 - Code → Picture" : 
                 question.type === "stack_reasoning" ? "Quiz 6 - Stack Reasoning" : 
                 question.type === "code_input" ? "Quiz 7 - Code Input" :
                 "Quiz 4 - Transform MCQ"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Question ID: {question.questionId} | Tier {question.tier}
              </p>
            </div>
            <div className="text-sm font-mono bg-secondary px-3 py-1 rounded">
              Seed: {question.seed.substring(0, 12)}...
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Q7: Code Input - Show initial and target, let student input code */}
          {question.type === "code_input" && question.targetSequence && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed mb-4">
                Write OpenGL transformation code to transform the initial shape into the target shape.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Note:</strong> Use glTranslatef(x, y, z) for translation and glRotatef(angle, x, y, z) for rotation. 
                The visualization updates in real-time as you type!
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Initial State:</p>
                  <ThreeScene 
                    key={`${question.questionId}-initial`}
                    shape={question.variant.shape} 
                    transforms={[]}
                    width={240}
                    height={200}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ transforms: [], shape: question.variant.shape })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Result (Real-time):</p>
                  <ThreeScene 
                    key={`${question.questionId}-current-${currentTransforms.length}`}
                    shape={question.variant.shape} 
                    transforms={currentTransforms}
                    width={240}
                    height={200}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ transforms: currentTransforms, shape: question.variant.shape })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Target State:</p>
                  <ThreeScene 
                    key={`${question.questionId}-target`}
                    shape={question.variant.shape} 
                    transforms={question.targetSequence}
                    width={240}
                    height={200}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ transforms: question.targetSequence!, shape: question.variant.shape })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Your Code:</label>
                <Textarea
                  value={codeInput}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="glTranslatef(1.0, 0.0, 0.0);&#10;glRotatef(90.0, 0, 0, 1);"
                  className="font-mono text-sm min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Parsed {currentTransforms.length} transformation{currentTransforms.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Q4: Show initial state, options show both visualization + code */}
          {question.type === "transform_mcq" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed mb-4">
                Given is a function <code className="bg-codeBg px-2 py-0.5 rounded">drawShape()</code> which draws a wireframe
                representation of the shape in the xy-plane as shown in the image on the right.
              </p>
              <p className="text-sm font-semibold mb-2">
                Which OpenGL transformations result in the pictures below?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Note:</strong> Distances are in units, angles are in degrees.
              </p>
              <div className="border rounded-lg p-4 bg-muted/20 inline-block relative group">
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Initial State:</p>
                <ThreeScene 
                  key={`${question.questionId}-initial`} 
                  transforms={[]} 
                  shape={question.variant.shape} 
                  width={320} 
                  height={240} 
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setEnlargedViz({ transforms: [], shape: question.variant.shape })}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Q5: Show initial state and code */}
          {question.type === "code_picture" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed mb-4">
                What image is drawn by the following code segment?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Note:</strong> Distances are in units, angles are in degrees. Format: glTranslatef(x, y, z) and glRotatef(angle, axisX, axisY, axisZ)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-codeBg font-mono text-sm">
                  {question.variant.sequence.map((transform, idx) => (
                    <div key={idx}>
                      {transform.type === "translate" 
                        ? `glTranslatef(${transform.params.join(", ")});`
                        : `glRotatef(${transform.params.join(", ")});`
                      }
                    </div>
                  ))}
                </div>
                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Initial State:</p>
                  <ThreeScene 
                    key={`${question.questionId}-q5-initial`} 
                    transforms={[]} 
                    shape={question.variant.shape} 
                    width={320} 
                    height={240} 
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ transforms: [], shape: question.variant.shape })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Q6: Show reference + target pattern, ask for code to create pattern */}
          {question.type === "stack_reasoning" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed mb-4">
                Given is the shape below drawn by using the function <code className="bg-codeBg px-2 py-0.5 rounded">drawOne()</code>. 
                How can we use this function to draw the object on the right?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Note:</strong> Distances are in units, angles are in degrees.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Reference (drawOne):</p>
                  <ThreeScene 
                    key={`${question.questionId}-reference`}
                    shape={question.variant.shape} 
                    transforms={[]}
                    width={320}
                    height={240}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ transforms: [], shape: question.variant.shape })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/20 relative group">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Target Pattern:</p>
                  <ThreeScene 
                    key={`${question.questionId}-target`}
                    shape={question.variant.shape} 
                    transforms={question.variant.sequence}
                    width={320}
                    height={240}
                    showMultipleInstances={true}
                    numInstances={question.variant.numInstances || 3}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEnlargedViz({ 
                      transforms: question.variant.sequence, 
                      shape: question.variant.shape,
                      showMultipleInstances: true,
                      numInstances: question.variant.numInstances || 3
                    })}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          {question.type !== "code_input" && (
            <div className={`pt-4 ${question.type === "transform_mcq" ? "grid grid-cols-2 gap-4" : "space-y-3"}`}>
            <p className="text-sm font-medium text-muted-foreground col-span-2">Select your answer:</p>
            {question.options.map((option, idx) => {
              const optionLabel = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* Q4: Show both visualization and code options */}
                  {question.type === "transform_mcq" && (
                    <div className="space-y-3">
                      <div className="font-bold text-lg">{optionLabel}.</div>
                      <div className="border rounded bg-muted/10 p-3 relative group">
                        <ThreeScene 
                          key={`${question.questionId}-option-${idx}`}
                          shape={question.variant.shape} 
                          transforms={option}
                          width={280}
                          height={200}
                          showInitialState={true}
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedViz({ transforms: option, shape: question.variant.shape, showInitialState: true });
                          }}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-codeBg p-3 rounded font-mono text-sm space-y-1">
                        {option.map((transform, tidx) => (
                          <div key={tidx}>
                            {transform.type === "translate" 
                              ? `glTranslatef(${transform.params.map(p => p.toFixed(1)).join(", ")});`
                              : `glRotatef(${transform.params[0].toFixed(1)}, ${transform.params[1]}, ${transform.params[2]}, ${transform.params[3]});`
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Q6: Show code options only */}
                  {question.type === "stack_reasoning" && (
                    <div>
                      <div className="font-bold text-lg mb-2">{optionLabel}.</div>
                      <div className="bg-codeBg p-3 rounded font-mono text-sm space-y-1">
                        {option.map((transform, tidx) => (
                          <div key={tidx}>
                            {transform.type === "translate" 
                              ? `glTranslatef(${transform.params.map(p => p.toFixed(2)).join(", ")});`
                              : `glRotatef(${transform.params[0].toFixed(1)}, ${transform.params[1]}, ${transform.params[2]}, ${transform.params[3]});`
                            }
                          </div>
                        ))}
                        <div className="text-muted-foreground">drawOne();</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Q5: Show image options with initial state */}
                  {question.type === "code_picture" && (
                    <div className="flex items-start gap-4">
                      <div className="font-bold text-lg pt-2">{optionLabel}.</div>
                      <div className="flex-1 border rounded bg-muted/10 p-2 relative group">
                        <ThreeScene 
                          key={`${question.questionId}-option-${idx}`}
                          shape={question.variant.shape} 
                          transforms={option}
                          width={300}
                          height={200}
                          showInitialState={true}
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedViz({ transforms: option, shape: question.variant.shape, showInitialState: true });
                          }}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                onClick={onPrev} 
                disabled={currentIndex === 0}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button 
                onClick={onNext} 
                disabled={currentIndex === totalQuestions - 1}
                variant="outline"
              >
                Next →
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={question.type === "code_input" ? codeInput.trim() === "" : selectedAnswer === null}
              size="lg"
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!enlargedViz} onOpenChange={() => setEnlargedViz(null)}>
        <DialogContent className="max-w-4xl">
          {enlargedViz && (
            <div className="flex items-center justify-center p-4">
              <ThreeScene
                transforms={enlargedViz.transforms}
                shape={enlargedViz.shape}
                width={800}
                height={600}
                showInitialState={enlargedViz.showInitialState}
                showMultipleInstances={enlargedViz.showMultipleInstances}
                numInstances={enlargedViz.numInstances}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
