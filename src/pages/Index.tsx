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
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CG ExamGen
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Computer Graphics Exam Generator - 3D Transformations
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-secondary px-4 py-2 rounded-lg">
              Topics: Transformations, Texture Mapping, Ray-Tracing
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <Tabs defaultValue="staff" className="w-full">
          <div className="container mx-auto px-6 mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 shadow-md">
              <TabsTrigger value="staff" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow">
                Staff Console
              </TabsTrigger>
              <TabsTrigger value="student" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow">
                Student Player
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="staff" className="mt-0">
            <StaffConsole />
          </TabsContent>

          <TabsContent value="student" className="mt-0">
            {questions.length === 0 ? (
              <div className="container mx-auto px-6 text-center py-16">
                <div className="space-y-4 max-w-lg mx-auto animate-fade-in">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    No question loaded yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch to Staff Console and generate questions to begin. Questions will automatically appear here for students to solve.
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

      <footer className="border-t bg-card mt-16 shadow-inner">
        <div className="container mx-auto px-6 py-8 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              CG ExamGen v1.0
            </p>
            <p className="text-xs text-muted-foreground">
              Deterministic exam generation with anti-collusion design
            </p>
            <p className="text-xs text-muted-foreground">
              Features: Tier-based difficulty • Seeded RNG • Interactive 3D visualizations
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
