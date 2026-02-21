'use server';

/**
 * @fileOverview A Genkit flow that suggests matching identity records based on biometric data or RFID tags.
 *
 * - aiIdentityRecordSuggester - A function that handles the identity record suggestion process.
 * - AIIdentityRecordSuggesterInput - The input type for the aiIdentityRecordSuggester function.
 * - AIIdentityRecordSuggesterOutput - The return type for the aiIdentityRecordSuggester function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Part } from '@genkit-ai/ai';

// First, define the IdentityRecordSchema based on the project proposal.
const IdentityRecordSchema = z.object({
  identity_id: z.string().describe("Unique identifier for the identity record."),
  user_id: z.string().describe("User ID associated with this identity record."),
  rfid_tag: z.string().optional().describe("RFID tag, if available."),
  biometric_hash: z.string().optional().describe("Biometric hash, if available."),
  status: z.string().describe("Status of the identity record (e.g., 'active', 'inactive')."),
});
export type IdentityRecord = z.infer<typeof IdentityRecordSchema>;

const AIIdentityRecordSuggesterInputSchema = z.object({
  biometricData: z
    .string()
    .optional()
    .describe(
      "Biometric data for the new or existing student, as a hash string or a data URI for a biometric scan image. Expected format: 'data:<mimetype>;base64,<encoded_data>' if an image."
    ),
  rfidTag: z.string().optional().describe("RFID tag of the student, if available."),
  currentIdentityRecords: z
    .array(IdentityRecordSchema)
    .describe("A list of existing identity records from the database to compare against."),
});
export type AIIdentityRecordSuggesterInput = z.infer<
  typeof AIIdentityRecordSuggesterInputSchema
>;

const AIIdentityRecordSuggesterOutputSchema = z.object({
  suggestedRecord: IdentityRecordSchema.optional().describe(
    "The most probable matching identity record found in the database. Null if no suitable match is found."
  ),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("A confidence score (0-1) for the suggested match, where 1 is absolute certainty."),
  reasoning: z
    .string()
    .describe("Explanation for why the suggested record was chosen or why no match was found."),
});
export type AIIdentityRecordSuggesterOutput = z.infer<
  typeof AIIdentityRecordSuggesterOutputSchema
>;

export async function aiIdentityRecordSuggester(
  input: AIIdentityRecordSuggesterInput
): Promise<AIIdentityRecordSuggesterOutput> {
  return aiIdentityRecordSuggesterFlow(input);
}

const aiIdentityRecordSuggesterPrompt = ai.definePrompt({
  name: 'aiIdentityRecordSuggesterPrompt',
  input: { schema: AIIdentityRecordSuggesterInputSchema },
  output: { schema: AIIdentityRecordSuggesterOutputSchema },
  prompt: (input: AIIdentityRecordSuggesterInput) => {
    const parts: Part[] = [
      {
        text: `You are an intelligent AI assistant specialized in identifying and matching student identity records. Your goal is to suggest the most probable existing identity record from a provided list, based on new biometric data or an RFID tag.\n\nYou will be given the following information:\n1.  New input data (either biometric data, an RFID tag, or both). Biometric data can be an image or a hash.\n2.  A JSON array of existing identity records from the database.\n\nYour task is to:\n-   Carefully analyze the new input data.\n-   Compare it against each record in the 'currentIdentityRecords' list.\n-   Prioritize exact matches on 'rfid_tag' and 'biometric_hash'.\n-   If 'biometricData' is provided as an image, analyze its characteristics to find visual matches if no hash is present or to augment hash comparison.\n-   Select the single most probable matching record.\n-   Provide a 'confidenceScore' (0-1) indicating how certain you are about the match.\n-   Give a clear 'reasoning' for your selection or explain why no suitable match was found.\n\nIf no highly confident match is found, set 'suggestedRecord' to null and provide a 'confidenceScore' close to 0.\nOutput your response strictly in the JSON format described by the output schema.\n\n---\nNew Input Data:\n${input.rfidTag ? `RFID Tag: ${input.rfidTag}\n` : ''}
${input.biometricData && !input.biometricData.startsWith("data:") ? `Biometric Hash: ${input.biometricData}\n` : ''}\n---\nExisting Identity Records (JSON format):\n${JSON.stringify(input.currentIdentityRecords, null, 2)}
`
      }
    ];

    if (input.biometricData && input.biometricData.startsWith("data:")) {
      parts.push({ media: { url: input.biometricData } });
      parts.push({ text: "Biometric Data: (See attached image above)" });
    }

    return parts;
  },
});

const aiIdentityRecordSuggesterFlow = ai.defineFlow(
  {
    name: 'aiIdentityRecordSuggesterFlow',
    inputSchema: AIIdentityRecordSuggesterInputSchema,
    outputSchema: AIIdentityRecordSuggesterOutputSchema,
  },
  async (input) => {
    const { output } = await aiIdentityRecordSuggesterPrompt(input);
    return output!;
  }
);
