
/**
 * @fileOverview Zod schemas and TypeScript types for the 'createTaskFromVoice' AI flow.
 */

import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const CollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const CreateTaskFromVoiceInputSchema = z.object({
  command: z.string().describe('The natural language command from the user.'),
  availableTasks: z
    .array(TaskSchema)
    .describe('A list of available tasks the new task can depend on.'),
  availableCollections: z
    .array(CollectionSchema)
    .describe('A list of available collections the new task can be assigned to.'),
  currentDate: z
    .string()
    .describe('The current date in ISO format, to help resolve relative dates like "tomorrow".'),
});
export type CreateTaskFromVoiceInput = z.infer<
  typeof CreateTaskFromVoiceInputSchema
>;

const MonthlyRecurrenceSchema = z.object({
    mode: z.enum(['onDate', 'onWeekday']).describe("Whether the monthly recurrence is on a specific date or weekday."),
    dates: z.array(z.number().min(1).max(31)).optional().describe("An array of dates (1-31) for 'onDate' mode."),
    weekdays: z.array(z.object({
        order: z.enum(['First', 'Second', 'Third', 'Fourth', 'Last']).describe("The order of the week in the month."),
        day: z.number().min(0).max(6).describe("The day of the week (0=Sun, 6=Sat)."),
    })).optional().describe("An array of weekday rules for 'onWeekday' mode."),
});

const YearlyRecurrenceSchema = z.object({
    mode: z.enum(['onDate', 'onWeekday']).describe("Whether the yearly recurrence is on a specific date or weekday."),
    dates: z.array(z.object({
        month: z.number().min(0).max(11).describe("The month of the year (0=Jan, 11=Dec)."),
        day: z.number().min(1).max(31).describe("The day of the month (1-31)."),
    })).optional().describe("An array of specific dates for 'onDate' mode."),
    weekdays: z.array(z.object({
        order: z.enum(['First', 'Second', 'Third', 'Fourth', 'Last']).describe("The order of the week in the month."),
        day: z.number().min(0).max(6).describe("The day of the week (0=Sun, 6=Sat)."),
        month: z.number().min(0).max(11).describe("The month of the year (0=Jan, 11=Dec)."),
    })).optional().describe("An array of weekday rules for 'onWeekday' mode."),
});

const RecurrenceSchema = z.object({
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().describe("The recurrence interval."),
  endDate: z.string().optional().describe("The end date for the recurrence in YYYY-MM-DD format."),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().describe("Array of days for weekly recurrence (0=Sun, 6=Sat)."),
  monthly: MonthlyRecurrenceSchema.optional().describe("Details for monthly recurrence."),
  yearly: YearlyRecurrenceSchema.optional().describe("Details for yearly recurrence."),
});


export const CreateTaskFromVoiceOutputSchema = z.object({
  title: z.string().optional().describe('The title of the work item.'),
  description: z.string().optional().describe('The description of the work item.'),
  assignee: z.string().optional().describe("The name of the person assigned to the work item."),
  reporter: z.string().optional().describe("The name of the person who reported the work item."),
  requester: z.string().optional().describe("The name of the person who requested the work item."),
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
  reviewer: z.string().optional().describe("The name of the person who will review the work item."),
  parentId: z
    .string()
    .optional()
    .describe('The ID of the parent collection, if mentioned.'),
  dependsOn: z
    .array(z.string())
    .optional()
    .describe('An array of work item IDs that this work item depends on.'),
  isRecurring: z.boolean().optional().describe("Whether the work item is a recurring task."),
  recurrence: RecurrenceSchema.optional().describe("The recurrence rule for the work item."),
});
export type CreateTaskFromVoiceOutput = z.infer<
  typeof CreateTaskFromVoiceOutputSchema
>;
