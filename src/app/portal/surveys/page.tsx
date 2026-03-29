"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2, Send } from "lucide-react";
import type { EvaluatorRole, Survey } from "@/lib/types";

// Mock survey data - in a real app, this would be fetched from Firestore based on user role/link
const mockSurvey: Survey = {
  survey_id: "ssr_001",
  school_id: "sch_123",
  title: "Annual School Climate Survey",
  target_role: "School Climate",
  questions: [
    { id: 'q1', type: 'rating', text: 'How would you rate the overall safety at the school?', options: ['1 (Poor)', '2', '3', '4', '5 (Excellent)'] },
    { id: 'q2', type: 'text', text: 'What is one thing the school does very well?' },
    { id: 'q3', type: 'multiple-choice', text: 'How effective is communication from the school administration?', options: ['Very effective', 'Somewhat effective', 'Neutral', 'Somewhat ineffective', 'Very ineffective'] },
    { id: 'q4', type: 'textarea', text: 'Do you have any suggestions for improving the school environment? Please provide details.' },
  ],
};

export default function SurveyPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Dynamically build a Zod schema from the survey questions
    const formSchema = z.object(
      mockSurvey.questions.reduce((acc, q) => {
        acc[q.id] = z.string().min(1, { message: "This field is required." });
        return acc;
      }, {} as Record<string, z.ZodString>)
    );

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a survey.' });
            return;
        }

        setLoading(true);
        console.log("Survey submitted by:", user.role);
        console.log("Answers:", values);

        // Here you would save to Firestore in a 'Survey_Responses' collection
        // const response = {
        //   survey_id: mockSurvey.survey_id,
        //   evaluator_role: user.role as EvaluatorRole, // Assuming user.role matches EvaluatorRole
        //   json_answers: JSON.stringify(values),
        //   submittedBy: user.user_id,
        //   submittedAt: new Date(),
        // };

        setTimeout(() => { // Simulate API call
            setLoading(false);
            toast({
                title: "Survey Submitted!",
                description: "Thank you for your valuable feedback.",
            });
            form.reset();
        }, 1500);
    }

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{mockSurvey.title}</CardTitle>
                <CardDescription>Your feedback is anonymous and helps us improve. Please answer all questions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {mockSurvey.questions.map(q => (
                            <FormField
                                key={q.id}
                                control={form.control}
                                name={q.id as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">{q.text}</FormLabel>
                                        <FormControl>
                                            {q.type === 'text' && <Input {...field} />}
                                            {q.type === 'textarea' && <Textarea {...field} rows={4} />}
                                            {q.type === 'multiple-choice' && (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                                                    <SelectContent>
                                                    {q.options.map((opt: any) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {q.type === 'rating' && (
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4">
                                                    {q.options.map((opt: any) => (
                                                        <FormItem key={opt} className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={opt} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{opt}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Feedback
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
