import { config } from 'dotenv';
config();

import '@/ai/flows/survey-question-generator-flow.ts';
import '@/ai/flows/ai-survey-response-summarizer-flow.ts';
import '@/ai/flows/ai-identity-record-suggester.ts';