import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThreeScene } from "./ThreeScene";
import { Question, Transform } from "@/types/question";
import { toast } from "sonner";

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

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [question.questionId]);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === question.correctIndex;
    
    if (isCorrect) {
      toast.success("Correct! Well done!");
    } else {
      toast.error(`Incorrect. The correct answer was option ${String.fromCharCode(65 + question.correctIndex)}`);
    }
    
    onSubmit?.(selectedAnswer);
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
          {/* Q4: Show initial state and target shape */}
          {question.type === "transform_mcq" && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-base leading-relaxed mb-4">
                    Given is a function <code className="bg-codeBg px-2 py-0.5 rounded">drawShape()</code> which draws a wireframe
                    representation of the shape. Which OpenGL transformations result in the picture shown on the right?
                  </p>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Initial State:</p>
                    <ThreeScene 
                      key={`${question.questionId}-initial`} 
                      transforms={[]} 
                      shape={question.variant.shape} 
                      width={240} 
                      height={180} 
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Target (with initial in gray):</p>
                  <ThreeScene 
                    key={`${question.questionId}-objective`} 
                    transforms={question.variant.sequence} 
                    shape={question.variant.shape} 
                    width={280} 
                    height={220}
                    showInitialState={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Q5: Show initial state and code */}
          {question.type === "code_picture" && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-base leading-relaxed mb-4">
                    What image is drawn by the following code segment?
                  </p>
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
                </div>
                <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Initial State:</p>
                  <ThreeScene 
                    key={`${question.questionId}-q5-initial`} 
                    transforms={[]} 
                    shape={question.variant.shape} 
                    width={240} 
                    height={180} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Q6: Show reference (initial) + target with initial state overlay */}
          {question.type === "stack_reasoning" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed">
                Given is the shape below drawn by using the function <code className="bg-codeBg px-2 py-0.5 rounded">drawOne()</code>. 
                How can we use this function to draw the target pattern on the right (with {question.variant.numInstances || 3} instances)?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Reference (drawOne):</p>
                  <ThreeScene 
                    key={`${question.questionId}-reference`}
                    shape={question.variant.shape} 
                    transforms={[]}
                    width={280}
                    height={220}
                  />
                </div>
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Target Pattern (with initial in gray):</p>
                  <ThreeScene 
                    key={`${question.questionId}-target`}
                    shape={question.variant.shape} 
                    transforms={question.variant.sequence}
                    width={280}
                    height={220}
                    showInitialState={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium text-muted-foreground">Select your answer:</p>
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
                  {/* Q4 and Q6: Show code options */}
                  {(question.type === "transform_mcq" || question.type === "stack_reasoning") && (
                    <div>
                      <div className="font-bold text-lg mb-2">{optionLabel}.</div>
                      <div className="bg-codeBg p-3 rounded font-mono text-sm space-y-1">
                        {option.map((transform, tidx) => (
                          <div key={tidx}>
                            {transform.type === "translate" 
                              ? `glTranslatef(${transform.params.join(", ")});`
                              : `glRotatef(${transform.params.join(", ")});`
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Q5: Show image options with initial state */}
                  {question.type === "code_picture" && (
                    <div className="flex items-start gap-4">
                      <div className="font-bold text-lg pt-2">{optionLabel}.</div>
                      <div className="flex-1 border rounded bg-muted/10 p-2">
                        <ThreeScene 
                          key={`${question.questionId}-option-${idx}`}
                          shape={question.variant.shape} 
                          transforms={option}
                          width={300}
                          height={200}
                          showInitialState={true}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

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
              disabled={selectedAnswer === null}
              size="lg"
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
