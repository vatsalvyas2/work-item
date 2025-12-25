
/**
 * @fileOverview Zod schemas and TypeScript types for the 'createTaskFromVoice' AI flow.
 */

import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const EpicSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const CreateTaskFromVoiceInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
  availableTasks: z
    .array(TaskSchema)
    .describe('A list of available tasks the new task can depend on.'),
  availableEpics: z
    .array(EpicSchema)
    .describe('A list of available epics the new task can be assigned to.'),
  currentDate: z
    .string()
    .describe('The current date in ISO format, to help resolve relative dates like "tomorrow".'),
});
export type CreateTaskFromVoiceInput = z.infer<
  typeof CreateTaskFromVoiceInputSchema
>;

export const CreateTaskFromVoiceOutputSchema = z.object({
  title: z.string().optional().describe('The title of the work item.'),
  description: z.string().optional().describe('The description of the work item.'),
  assignee: z.string().optional().describe("The name of the person assigned to the work item."),
  reporter: z.string().optional().describe("The name of the person who reported the work item."),
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('The priority of the work item.'),
  dueDate: z
    .string()
    .optional()
    .describe('The due date of the work item in YYYY-MM-DD format.'),
  dueTime: z.string().optional().describe("The due time in HH:mm format (24-hour clock)."),
  reviewRequired: z
    .boolean()
    .optional()
    .describe('Whether a review is required for this work item.'),
  isCritical: z
    .boolean()
    .optional()
    .describe('Whether the work item is critical.'),
  parentId: z
    .string()
    .optional()
    .describe('The ID of the parent epic, if mentioned.'),
  dependsOn: z
    .array(z.string())
    .optional()
    .describe('An array of work item IDs that this work item depends on.'),
});
export type CreateTaskFromVoiceOutput = z.infer<
  typeof CreateTaskFromVoiceOutputSchema
>;
