// stall-recommendation.ts
'use server';
/**
 * @fileOverview An AI-powered tool to suggest similar stalls based on a selected one.
 *
 * - stallRecommendation - A function that handles the stall recommendation process.
 * - StallRecommendationInput - The input type for the stallRecommendation function.
 * - StallRecommendationOutput - The return type for the stallRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StallRecommendationInputSchema = z.object({
  selectedStallCategory: z.string().describe('The category of the selected stall.'),
  selectedStallSegment: z.string().describe('The segment of the selected stall.'),
  stallCategories: z.array(z.string()).describe('A list of available stall categories.'),
  stallSegments: z.array(z.string()).describe('A list of available stall segments.'),
});
export type StallRecommendationInput = z.infer<typeof StallRecommendationInputSchema>;

const StallRecommendationOutputSchema = z.object({
  recommendation: z.string().describe('A message recommending similar stalls or indicating that none are available.'),
});
export type StallRecommendationOutput = z.infer<typeof StallRecommendationOutputSchema>;

export async function stallRecommendation(input: StallRecommendationInput): Promise<StallRecommendationOutput> {
  return stallRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stallRecommendationPrompt',
  input: {schema: StallRecommendationInputSchema},
  output: {schema: StallRecommendationOutputSchema},
  prompt: `You are an AI assistant that suggests similar stalls based on a selected stall's category and segment.

  Available stall categories: {{stallCategories}}
  Available stall segments: {{stallSegments}}

  Selected stall category: {{selectedStallCategory}}
  Selected stall segment: {{selectedStallSegment}}

  Based on the selected stall's category and segment, recommend other stalls with the same category and segment. If no similar stalls are available, respond that no similar stalls are available.
  `,
});

const stallRecommendationFlow = ai.defineFlow(
  {
    name: 'stallRecommendationFlow',
    inputSchema: StallRecommendationInputSchema,
    outputSchema: StallRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
