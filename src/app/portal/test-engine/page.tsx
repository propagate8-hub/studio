"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Save, Timer } from "lucide-react";
import type { Assessment, AssessmentLog } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";

// Mock assessment data that would be fetched from Firestore and saved to Dexie
const mockAssessment: Assessment = {
  assessment_id: "acet-001",
  title: "Aptitude and Career Exploration Test",
  type: "ACET",
  is_offline_enabled: true,
  questions: [
    { id: 'q1', text: 'If a train travels at 60 km/h, how far does it travel in 30 minutes?', options: ['30 km', '60 km', '15 km', '120 km'], answer: '30 km' },
    { id: 'q2', text: 'Which of the following is a prime number?', options: ['4', '9', '17', '21'], answer: '17' },
    { id: 'q3', text: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], answer: 'Ottawa' },
    { id: 'q4', text: 'Solve for x: 2x + 5 = 15', options: ['5', '10', '2.5', '7.5'], answer: '5' },
    { id: 'q5', text: 'The sun is a...', options: ['Planet', 'Star', 'Comet', 'Satellite'], answer: 'Star' },
  ],
};

const TEST_DURATION_MINUTES = 90;

export default function TestEnginePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | undefined>(undefined);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60);

  // Attempt to load assessment from Dexie, fallback to mock and populate Dexie
  const localAssessment = useLiveQuery(() => localDb.assessments.get(mockAssessment.assessment_id), []);

  useEffect(() => {
    async function setupAssessment() {
      if (localAssessment) {
        setAssessment(localAssessment);
      } else {
        // If not in Dexie, populate it for offline use
        await localDb.assessments.put(mockAssessment);
        setAssessment(mockAssessment);
      }
    }
    setupAssessment();
  }, [localAssessment]);

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


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!assessment) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading Assessment...</span></div>;
  }
  
  const currentQuestion = assessment.questions?.[currentQuestionIndex];
  const progress = (currentQuestionIndex / (assessment.questions?.length || 1)) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < (assessment.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    if (isFinished) return; // Prevent multiple submissions
    setIsFinished(true);

    let finalScore = 0;
    assessment.questions?.forEach(q => {
      if (answers[q.id] === q.answer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    
    if (!user) {
        toast({variant: "destructive", title: "Error", description: "You must be logged in to save results."})
        return;
    }

    const newLog: AssessmentLog = {
        log_id: `log_${user.user_id}_${assessment.assessment_id}_${Date.now()}`,
        user_id: user.user_id,
        assessment_id: assessment.assessment_id,
        raw_score: finalScore,
        sync_status: 'pending',
        payment_status: 'paid', // Assuming B2C flow
        completedAt: new Date(),
    };
    
    try {
        await localDb.assessment_logs.add(newLog);
        toast({
            title: "Test Finished!",
            description: "Your results have been saved locally. They will sync to the cloud when you're online.",
        });
    } catch(e) {
        console.error("Failed to save log to Dexie", e);
        toast({variant: "destructive", title: "Save Error", description: "Could not save your results locally."})
    }
  };

  if (isFinished) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <CardTitle className="text-3xl font-headline">Test Complete!</CardTitle>
                <CardDescription>You have successfully completed the {assessment.title}.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-lg">Your Score:</p>
                <p className="text-5xl font-bold font-headline text-primary">{score} / {assessment.questions?.length}</p>
                <p className="text-muted-foreground mt-4">Your results are saved and will be synced.</p>
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
        <CardDescription>Question {currentQuestionIndex + 1} of {assessment.questions?.length}</CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="py-8">
          <h3 className="text-lg font-semibold">{currentQuestion.text}</h3>
          <RadioGroup 
            value={answers[currentQuestion.id]}
            onValueChange={(value) => setAnswers({...answers, [currentQuestion.id]: value})}
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
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
                {currentQuestionIndex === (assessment.questions?.length || 0) - 1 ? (
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
