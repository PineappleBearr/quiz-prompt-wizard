import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffConsole } from "@/components/StaffConsole";
import { StudentPlayer } from "@/components/StudentPlayer";
import { generateQuestion } from "@/utils/questionGenerator";
import { Question } from "@/types/question";
import { Button } from "@/components/ui/button";

// Global event emitter for question updates
const questionEventTarget = new EventTarget();
export const emitQuestionGenerated = (questions: Question[]) => {
  questionEventTarget.dispatchEvent(new CustomEvent('questionsGenerated', { detail: questions }));
};

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const handleQuestionsGenerated = (event: Event) => {
      const newQuestions = (event as CustomEvent).detail as Question[];
      if (newQuestions.length > 0) {
        setQuestions(newQuestions);
        setCurrentQuestionIndex(0); // Reset to first question
      }
    };

    questionEventTarget.addEventListener('questionsGenerated', handleQuestionsGenerated);
    return () => {
      questionEventTarget.removeEventListener('questionsGenerated', handleQuestionsGenerated);
    };
  }, []);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">CG ExamGen</h1>
              <p className="text-sm text-muted-foreground">Computer Graphics Exam Generator</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Weeks 4-6: Transformations, Texture Mapping, Ray-Tracing
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <Tabs defaultValue="staff" className="w-full">
          <div className="container mx-auto px-6 mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="staff">Staff Console</TabsTrigger>
              <TabsTrigger value="student">Student Player</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="staff" className="mt-0">
            <StaffConsole />
          </TabsContent>

          <TabsContent value="student" className="mt-0">
            {questions.length === 0 ? (
              <div className="container mx-auto px-6 text-center py-12">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No question loaded. Switch to Staff Console and generate a question.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Questions generated in Staff Console will automatically appear here.
                  </p>
                </div>
              </div>
            ) : (
              <StudentPlayer 
                question={questions[currentQuestionIndex]} 
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>CG ExamGen v1.0 - Deterministic exam generation with anti-collusion design</p>
          <p className="mt-1">Features: Tier-based difficulty, seeded RNG, transform MCQ (Quiz 4-style)</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
