'use server';
/**
 * @fileOverview A Genkit flow for summarizing survey responses using AI.
 *
 * - summarizeSurveyResponses - A function that handles the survey response summarization process.
 * - SummarizeSurveyResponsesInput - The input type for the summarizeSurveyResponses function.
 * - SummarizeSurveyResponsesOutput - The return type for the summarizeSurveyResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Schema for a single survey response.
 */
const SurveyResponseSchema = z.object({
  evaluatorRole: z.enum(['Parent', 'Student', 'Teacher']).describe('The role of the person who evaluated the survey.'),
  jsonAnswers: z.string().describe('The JSON string of the survey answers for a single response.'),
});

/**
 * Input schema for the survey response summarization flow.
 */
const SummarizeSurveyResponsesInputSchema = z.object({
  surveyTitle: z.string().describe('The title of the survey being summarized.'),
  responses: z.array(SurveyResponseSchema).describe('An array of individual survey responses, each containing the evaluator role and a JSON string of answers.'),
});
export type SummarizeSurveyResponsesInput = z.infer<typeof SummarizeSurveyResponsesInputSchema>;

/**
 * Output schema for the survey response summarization flow.
 */
const SummarizeSurveyResponsesOutputSchema = z.object({
  overallSummary: z.string().describe('A general summary of the survey responses, capturing the main points and overall sentiment.'),
  keyThemes: z.array(z.string()).describe('A list of key themes identified across all survey responses.'),
  commonFeedbackPoints: z.array(z.string()).describe('A list of common feedback points or suggestions mentioned by multiple respondents.'),
  significantTrends: z.array(z.string()).describe('A list of significant patterns or trends observed in the responses, such as shifts in opinion or consistent areas of concern/praise.'),
  overallSentiment: z.string().describe('The overall sentiment of the responses (e.g., positive, neutral, negative, or a more nuanced description like "mostly positive with some concerns").'),
});
export type SummarizeSurveyResponsesOutput = z.infer<typeof SummarizeSurveyResponsesOutputSchema>;

/**
 * Summarizes key themes, common feedback, and significant trends from a collection of survey responses.
 * @param input The survey responses to summarize.
 * @returns A structured summary including key themes, common feedback, trends, and overall sentiment.
 */
export async function summarizeSurveyResponses(input: SummarizeSurveyResponsesInput): Promise<SummarizeSurveyResponsesOutput> {
  return summarizeSurveyResponsesFlow(input);
}

/**
 * Defines the Genkit prompt for summarizing survey responses.
 * The prompt instructs the LLM to act as a survey analysis assistant and extract specific information.
 */
const prompt = ai.definePrompt({
  name: 'summarizeSurveyResponsesPrompt',
  input: {schema: SummarizeSurveyResponsesInputSchema},
  output: {schema: SummarizeSurveyResponsesOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing and summarizing survey responses for school administrators. Your goal is to provide a concise yet comprehensive overview of the feedback.

Analyze the provided survey responses for the survey titled "{{surveyTitle}}".
Identify the key themes, common feedback points, and significant trends. Also, determine the overall sentiment expressed in the responses.

Here are the survey responses to analyze:

{{#each responses}}
Evaluator Role: {{this.evaluatorRole}}
Answers (JSON): {{{this.jsonAnswers}}}
---
{{/each}}

Please provide an overall summary, a list of key themes, common feedback points, significant trends, and the overall sentiment based on the input, ensuring the output adheres strictly to the defined JSON schema.
`,
});

/**
 * Defines the Genkit flow for summarizing survey responses.
 * This flow takes survey responses as input, calls the defined prompt,
 * and returns the AI-generated summary.
 */
const summarizeSurveyResponsesFlow = ai.defineFlow(
  {
    name: 'summarizeSurveyResponsesFlow',
    inputSchema: SummarizeSurveyResponsesInputSchema,
    outputSchema: SummarizeSurveyResponsesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate survey summary.');
    }
    return output;
  }
);
