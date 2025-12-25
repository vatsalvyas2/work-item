
'use server';
/**
 * @fileOverview An AI flow to transcribe audio to text.
 *
 * - transcribeAudio - A function that handles audio transcription.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TranscribeAudioInputSchema, type TranscribeAudioInput } from '@/ai/schemas/transcribe-audio-schema';


export async function transcribeAudio(input: TranscribeAudioInput): Promise<string> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: z.string(),
  },
  async ({ audioDataUri }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-speech',
      prompt: [
        { media: { url: audioDataUri } },
        { text: 'Transcribe the spoken words in this audio recording.' },
      ],
    });

    return text;
  }
);
