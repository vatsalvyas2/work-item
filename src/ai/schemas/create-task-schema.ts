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
  title: z.string().optional().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  taskType: z
    .enum(['Story', 'Task', 'Bug'])
    .optional()
    .describe('The type of the work item.'),
  assignee: z.string().optional().describe("The name of the person assigned to the task."),
  reporter: z.string().optional().describe("The name of the person who reported the task."),
  priority: z
    .enum(['low', 'medium', 'high', 'none'])
    .optional()
    .describe('The priority of the task.'),
  plannedStartDate: z
    .string()
    .optional()
    .describe('The planned start date of the task in YYYY-MM-DD format.'),
  dueDate: z
    .string()
    .optional()
    .describe('The due date of the task in YYYY-MM-DD format.'),
  dueTime: z.string().optional().describe("The due time in HH:mm format (24-hour clock)."),
  duration: z.number().optional().describe('The estimated duration of the task in hours. The user might say "for 2 days", you should convert that to 16 hours assuming an 8-hour workday.'),
  reviewRequired: z
    .boolean()
    .optional()
    .describe('Whether a review is required for this task.'),
  isCritical: z
    .boolean()
    .optional()
    .describe('Whether the task is critical.'),
  parentId: z
    .string()
    .optional()
    .describe('The ID of the parent epic, if mentioned.'),
  dependsOn: z
    .array(z.string())
    .optional()
    .describe('An array of task IDs that this task depends on.'),
});
export type CreateTaskFromVoiceOutput = z.infer<
  typeof CreateTaskFromVoiceOutputSchema
>;
