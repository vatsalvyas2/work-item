
'use server';
/**
 * @fileOverview An AI flow to parse a user's natural language command
 * to create a new task, extracting structured data for a form.
 *
 * - createTaskFromVoice - A function that handles parsing the voice command.
 */

import { ai } from '@/ai/genkit';
import {
  CreateTaskFromVoiceInputSchema,
  CreateTaskFromVoiceOutputSchema,
  type CreateTaskFromVoiceInput,
  type CreateTaskFromVoiceOutput,
} from '@/ai/schemas/create-task-schema';

export async function createTaskFromVoice(
  input: CreateTaskFromVoiceInput
): Promise<CreateTaskFromVoiceOutput> {
  return createTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createTaskPrompt',
  input: { schema: CreateTaskFromVoiceInputSchema },
  output: { schema: CreateTaskFromVoiceOutputSchema },
  prompt: `You are an intelligent assistant that helps create tasks from a user's voice command. The user can speak in English or Hinglish (a mix of Hindi and English).
Your goal is to parse the user's command and extract the necessary information to fill out a task creation form.
**Crucially, all of your output MUST be in English, regardless of the input language.**

Today's date is {{currentDate}}. Use this to resolve relative dates like "tomorrow" or "next Friday".

Here are the available Epics:
{{#each availableEpics}}
- ID: {{id}}, Title: "{{title}}"
{{/each}}

Here are the available Tasks that can be dependencies:
{{#each availableTasks}}
- ID: {{id}}, Title: "{{title}}"
{{/each}}

Analyze the user's command and fill in the fields of the output schema in English.
- IMPORTANT: Take the user's description and enhance it. Rewrite it to be clearer, more detailed, and well-structured for a project management tool. The final description must be in English.
- For 'parentId', you MUST use the ID of the epic if the user mentions an epic title.
- For 'dependsOn', you MUST use the task IDs if the user mentions task titles as dependencies.
- Dates should be in 'YYYY-MM-DD' format.
- Times should be in 'HH:mm' format.
- Booleans should be true or false.
- Do not invent information. If a field is not mentioned, leave it empty.

User command: "{{command}}"`,
});

const createTaskFlow = ai.defineFlow(
  {
    name: 'createTaskFlow',
    inputSchema: CreateTaskFromVoiceInputSchema,
    outputSchema: CreateTaskFromVoiceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || {};
  }
);
