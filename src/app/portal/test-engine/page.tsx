"use client";

import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Save, Timer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Assessment, AssessmentLog, Question } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { mockAdaptiveQuestions } from "@/lib/mock-data";


const mockAssessment: Assessment = {
  assessment_id: "acet-adaptive-001",
  title: "Aptitude and Career Exploration Test (Adaptive)",
  type: "ACET",
  is_offline_enabled: true,
  questions: mockAdaptiveQuestions,
};

const TEST_DURATION_MINUTES = 90;
const APTITUDE_CATEGORIES: Question['aptitude_category'][] = ["Verbal", "Numerical", "Spatial", "Abstract"];
const QUESTIONS_PER_CATEGORY = 5;
const TOTAL_QUESTIONS = APTITUDE_CATEGORIES.length * QUESTIONS_PER_CATEGORY;
const STARTING_DIFFICULTY = 3;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;


export default function TestEnginePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | undefined>(undefined);
  
  const [categoryStates, setCategoryStates] = useState<Record<string, { difficulty: number; questionsAnswered: number; history: string[] }>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Question['aptitude_category']>(APTITUDE_CATEGORIES[0]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  const [isFinished, setIsFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60);

  const localAssessment = useLiveQuery(() => localDb.assessments.get(mockAssessment.assessment_id), []);

  useEffect(() => {
    async function setupAssessment() {
      if (localAssessment) {
        setAssessment(localAssessment);
      } else {
        await localDb.assessments.put(mockAssessment);
        setAssessment(mockAssessment);
      }

      // Initialize states for the adaptive test
      const initialCategoryStates: typeof categoryStates = {};
      for (const category of APTITUDE_CATEGORIES) {
        initialCategoryStates[category] = {
          difficulty: STARTING_DIFFICULTY,
          questionsAnswered: 0,
          history: [],
        };
      }
      setCategoryStates(initialCategoryStates);
      setQuestionNumber(1);
    }
    setupAssessment();
  }, [localAssessment]);
  
  useEffect(() => {
    if (assessment && Object.keys(categoryStates).length > 0) {
      const nextQuestion = findNextQuestion();
      setCurrentQuestion(nextQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment, categoryStates, currentCategory]);


  useEffect(() => {
    if (!assessment || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment, isFinished]);


  const findNextQuestion = () => {
    if (!assessment?.questions || isFinished) return null;
    
    const state = categoryStates[currentCategory];
    const { difficulty, history } = state;

    const availableQuestions = assessment.questions.filter(q => 
        q.aptitude_category === currentCategory &&
        q.difficulty_level === difficulty &&
        !history.includes(q.id)
    );

    if (availableQuestions.length > 0) {
      return availableQuestions[0];
    }
    
    // Fallback: if no question at current difficulty, try adjacent difficulties
    for (let offset = 1; offset <= MAX_DIFFICULTY; offset++) {
        const higherDifficulty = Math.min(MAX_DIFFICULTY, difficulty + offset);
        const lowerDifficulty = Math.max(MIN_DIFFICULTY, difficulty - offset);

        const higherQuestions = assessment.questions.filter(q => q.aptitude_category === currentCategory && q.difficulty_level === higherDifficulty && !history.includes(q.id));
        if (higherQuestions.length > 0) return higherQuestions[0];

        const lowerQuestions = assessment.questions.filter(q => q.aptitude_category === currentCategory && q.difficulty_level === lowerDifficulty && !history.includes(q.id));
        if (lowerQuestions.length > 0) return lowerQuestions[0];
    }

    return null; // Should not happen with enough questions
  };

  const handleNext = () => {
    if (!currentQuestion || selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    // Update category state
    const currentState = categoryStates[currentCategory];
    const newDifficulty = isCorrect
      ? Math.min(MAX_DIFFICULTY, currentState.difficulty + 1)
      : Math.max(MIN_DIFFICULTY, currentState.difficulty - 1);

    const updatedState = {
      ...currentState,
      difficulty: newDifficulty,
      questionsAnswered: currentState.questionsAnswered + 1,
      history: [...currentState.history, currentQuestion.id],
    };

    const newCategoryStates = { ...categoryStates, [currentCategory]: updatedState };
    setCategoryStates(newCategoryStates);
    
    if (questionNumber >= TOTAL_QUESTIONS) {
        finishTest(newCategoryStates);
    } else {
        // Move to the next category
        const currentCategoryIndex = APTITUDE_CATEGORIES.indexOf(currentCategory);
        const nextCategoryIndex = (currentCategoryIndex + 1) % APTITUDE_CATEGORIES.length;
        setCurrentCategory(APTITUDE_CATEGORIES[nextCategoryIndex]);
        setQuestionNumber(prev => prev + 1);
        setSelectedAnswer(null);
    }
  };

  const finishTest = async (finalStates?: typeof categoryStates) => {
    if (isFinished) return;
    setIsFinished(true);

    const statesToUse = finalStates || categoryStates;
    const scores: Record<string, number> = {};
    for (const category of APTITUDE_CATEGORIES) {
      scores[category] = statesToUse[category].difficulty;
    }
    setFinalScores(scores);
    
    if (!user) {
        toast({variant: "destructive", title: "Error", description: "You must be logged in to save results."})
        return;
    }

    const newLog: Omit<AssessmentLog, 'completedAt'> & { completedAt: Date } = {
        log_id: `log_${user.user_id}_${assessment?.assessment_id}_${Date.now()}`,
        user_id: user.user_id,
        assessment_id: assessment!.assessment_id,
        scores: scores,
        sync_status: 'pending',
        payment_status: 'paid', // Assuming B2C flow
        completedAt: new Date(),
    };
    
    try {
        await localDb.assessment_logs.add(newLog as AssessmentLog);
        toast({
            title: "Test Finished!",
            description: "Your results have been saved locally. They will sync to the cloud when you're online.",
        });
    } catch(e) {
        console.error("Failed to save log to Dexie", e);
        toast({variant: "destructive", title: "Save Error", description: "Could not save your results locally."})
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (questionNumber / TOTAL_QUESTIONS) * 100;

  if (!assessment || !currentQuestion) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading Adaptive Assessment...</span></div>;
  }

  if (isFinished) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <CardTitle className="text-3xl font-headline">Test Complete!</CardTitle>
                <CardDescription>You have successfully completed the {assessment.title}.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-lg font-semibold">Your Final Aptitude Levels:</p>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Aptitude Category</TableHead>
                      <TableHead className="text-right">Stabilized Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(finalScores).map(([category, score]) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{score} / {MAX_DIFFICULTY}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-muted-foreground mt-4">Your detailed report will be generated and made available in your dashboard after results are synced.</p>
                <Button asChild className="mt-6">
                    <a href="/portal/b2c/dashboard">Back to Dashboard</a>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-headline">{assessment.title}</CardTitle>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Timer className="h-5 w-5"/>
                <span>{formatTime(timeLeft)}</span>
            </div>
        </div>
        <CardDescription>Question {questionNumber} of {TOTAL_QUESTIONS} | Category: <span className="font-semibold text-primary">{currentCategory}</span></CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="py-8">
          <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
          <RadioGroup 
            value={selectedAnswer || ""}
            onValueChange={setSelectedAnswer}
            className="mt-6 space-y-4"
          >
            {currentQuestion.options.map((option: string) => (
              <Label key={option} className="flex items-center space-x-3 border rounded-md p-4 hover:bg-secondary has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-colors cursor-pointer">
                <RadioGroupItem value={option} id={option} />
                <span>{option}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-end">
            <Button onClick={handleNext} disabled={selectedAnswer === null}>
                {questionNumber === TOTAL_QUESTIONS ? (
                    <>
                    <Save className="mr-2 h-4 w-4" /> Finish & Save
                    </>
                ) : 'Next Question'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
