'use server';
/**
 * @fileOverview A Genkit flow for generating survey questions based on a given topic or objective.
 *
 * - generateSurveyQuestions - A function that generates a draft set of relevant survey questions.
 * - SurveyQuestionGeneratorInput - The input type for the generateSurveyQuestions function.
 * - SurveyQuestionGeneratorOutput - The return type for the generateSurveyQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SurveyQuestionGeneratorInputSchema = z.object({
  topic: z
    .string()
    .describe(
      'The topic or objective for which to generate survey questions.'
    ),
});
export type SurveyQuestionGeneratorInput = z.infer<
  typeof SurveyQuestionGeneratorInputSchema
>;

const SurveyQuestionGeneratorOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of generated survey questions.'),
});
export type SurveyQuestionGeneratorOutput = z.infer<
  typeof SurveyQuestionGeneratorOutputSchema
>;

export async function generateSurveyQuestions(
  input: SurveyQuestionGeneratorInput
): Promise<SurveyQuestionGeneratorOutput> {
  return surveyQuestionGeneratorFlow(input);
}

const surveyQuestionGeneratorPrompt = ai.definePrompt({
  name: 'surveyQuestionGeneratorPrompt',
  input: {schema: SurveyQuestionGeneratorInputSchema},
  output: {schema: SurveyQuestionGeneratorOutputSchema},
  prompt: `You are an AI assistant specialized in designing survey questions for educational institutions.

Your task is to generate a draft set of relevant, clear, and comprehensive survey questions based on the provided topic or objective. The questions should be suitable for school stakeholders such as parents, students, or teachers.

Generate at least 5 to 10 questions covering different aspects related to the topic.

Topic/Objective: {{{topic}}}

Provide the output as a JSON object with a single key 'questions' which contains an array of strings, where each string is a survey question.`,
});

const surveyQuestionGeneratorFlow = ai.defineFlow(
  {
    name: 'surveyQuestionGeneratorFlow',
    inputSchema: SurveyQuestionGeneratorInputSchema,
    outputSchema: SurveyQuestionGeneratorOutputSchema,
  },
  async (input) => {
    const {output} = await surveyQuestionGeneratorPrompt(input);
    return output!;
  }
);
