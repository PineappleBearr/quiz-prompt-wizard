import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer("");
  }, [question.questionId]);

  const handleSubmit = () => {
    const answerIndex = parseInt(selectedAnswer);
    const isCorrect = answerIndex === question.correctIndex;
    
    if (isCorrect) {
      toast.success("Correct! Well done!");
    } else {
      toast.error(`Incorrect. The correct answer was option ${String.fromCharCode(65 + question.correctIndex)}`);
    }
    
    onSubmit?.(answerIndex);
  };

  const formatTransform = (t: Transform): string => {
    if (t.type === "translate") {
      return `glTranslatef(${t.params[0]}, ${t.params[1]}, ${t.params[2]})`;
    } else if (t.type === "rotate") {
      return `glRotatef(${t.params[0]}, ${t.params[1]}, ${t.params[2]}, ${t.params[3]})`;
    }
    return "";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Quiz 4 - Transform MCQ</CardTitle>
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
          {/* Question prompt */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-base leading-relaxed">
                  <span className="inline-block w-6 h-6 rounded-full bg-primary text-primary-foreground text-center leading-6 mr-2">◉</span>
                  Given is a function <code className="bg-codeBg px-2 py-0.5 rounded">drawShape()</code> which draws a wireframe
                  representation of the number "1" in the xy-plane as shown in the image on the right.
                </p>
                <p className="text-base leading-relaxed mt-4">
                  Which OpenGL transformations result in the pictures below?
                </p>
              </div>
              <div className="flex-shrink-0">
                <ThreeScene key={`${question.questionId}-objective`} transforms={question.variant.sequence} shape={question.variant.shape} width={280} height={220} />
                <p className="text-xs text-center text-muted-foreground mt-1">Target shape (transformed)</p>
              </div>
            </div>
          </div>

          {/* Options */}
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="grid grid-cols-2 gap-6">
              {question.options.map((option, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="text-base font-medium cursor-pointer">
                      Option {String.fromCharCode(65 + idx)}
                    </Label>
                  </div>
                  <div className="border rounded-lg p-3 space-y-3 hover:border-primary transition-colors">
                    <ThreeScene key={`${question.questionId}-${idx}`} transforms={option} shape={question.variant.shape} width={320} height={240} />
                    <div className="bg-codeBg p-2 rounded text-xs font-mono space-y-0.5">
                      {option.map((t, tidx) => (
                        <div key={tidx}>{formatTransform(t)};</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

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
              disabled={selectedAnswer === ""}
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
