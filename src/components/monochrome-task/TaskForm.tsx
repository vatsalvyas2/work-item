
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task, Epic, TaskType } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  taskType: z.enum(['Story', 'Task', 'Bug', 'Epic']),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "none"]),
  isCritical: z.boolean().default(false),
  reviewRequired: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    endDate: z.date().optional(),
  }).optional(),
  parentId: z.string().optional(),
  dependsOn: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  reporter: z.string().optional(),
  plannedStartDate: z.date().optional(),
  duration: z.number().optional(),
}).refine(data => {
    if (data.isRecurring) {
        return !!data.recurrence?.interval;
    }
    return true;
}, {
    message: "Recurrence interval is required for recurring tasks.",
    path: ["recurrence.interval"],
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  onTaskSubmit: (data: Omit<Task, "id" | "status" | "createdAt" | "timeline" | "subtasks" | "comments" >) => void;
  onEpicSubmit: (data: Omit<Epic, "id" | "project">) => void;
  epics: Epic[];
  tasks: Task[];
}

export function TaskForm({ onTaskSubmit, onEpicSubmit, epics, tasks }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      taskType: "Task",
      priority: "medium",
      isCritical: false,
      reviewRequired: false,
      isRecurring: false,
      recurrence: {
        interval: undefined,
        endDate: undefined,
      },
      parentId: "none",
      dependsOn: [],
      assignee: "",
      reporter: "",
      dueTime: "",
    },
  });

  const taskType = form.watch("taskType");
  const isRecurring = form.watch("isRecurring");
  
  const handleSubmit = (data: FormValues) => {
    if (data.taskType === 'Epic') {
        const { title, description } = data;
        onEpicSubmit({ title, description: description || '' });
    } else {
        const { dueTime, ...taskData } = data;
        
        let finalDueDate: Date | undefined = taskData.dueDate;
        if (taskData.dueDate && dueTime) {
            const [hours, minutes] = dueTime.split(':').map(Number);
            finalDueDate = new Date(taskData.dueDate);
            finalDueDate.setHours(hours, minutes);
        }

        const firstDueDate = taskData.isRecurring ? taskData.plannedStartDate : finalDueDate;

        onTaskSubmit({
          ...taskData,
          parentId: taskData.parentId === 'none' ? undefined : taskData.parentId,
          taskType: taskData.taskType as TaskType,
          dueDate: firstDueDate,
          recurrence: taskData.isRecurring ? data.recurrence : undefined,
          duration: data.duration ? Number(data.duration) : undefined,
        });
    }

    form.reset();
  };

  const isEpic = taskType === 'Epic';
  const availableTasksForDepencency = tasks.filter(t => t.status !== 'Done' && t.status !== 'Cancelled');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New {isEpic ? 'Epic' : 'Task'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Story">Story</SelectItem>
                        <SelectItem value="Bug">Bug</SelectItem>
                        <SelectItem value="Epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder={isEpic ? "e.g., User Authentication Feature" : "e.g., Finish the report"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a more detailed description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEpic && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignee</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reporter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporter</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="plannedStartDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Planned Start Date</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal h-10",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Duration (hours)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 8" {...field} onChange={e => field.onChange(parseInt(e.target.value))}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isRecurring && (
                    <>
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Due Date</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal h-10",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dueTime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Epic</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to an epic (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Epic</SelectItem>
                            {epics.map(epic => (
                              <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependsOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Depends On</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                              >
                                {field.value?.length 
                                  ? `${field.value.length} selected`
                                  : "Select tasks"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search tasks..." />
                              <CommandList>
                                <CommandEmpty>No tasks found.</CommandEmpty>
                                <CommandGroup>
                                  {availableTasksForDepencency.map((task) => (
                                    <CommandItem
                                      value={task.id}
                                      key={task.id}
                                      onSelect={() => {
                                        const currentValue = field.value || [];
                                        const isSelected = currentValue.includes(task.id);
                                        const newValue = isSelected
                                          ? currentValue.filter((id) => id !== task.id)
                                          : [...currentValue, task.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value?.includes(task.id)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {task.title}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <div className="flex flex-wrap gap-4">
                    <FormField
                      control={form.control}
                      name="reviewRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 pt-5">
                          <FormControl>
                            <Switch
                              id="review-required"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel htmlFor="review-required">Review Required</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isCritical"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 pt-5">
                          <FormControl>
                            <Switch
                              id="critical-task"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel htmlFor="critical-task">Critical</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="isRecurring"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 pt-5">
                                <FormControl>
                                    <Switch
                                    id="recurring-task"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel htmlFor="recurring-task">Recurring Task</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>

                {isRecurring && (
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-3 shadow-sm">
                        <FormField
                            control={form.control}
                            name="recurrence.interval"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Repeats</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select interval" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="recurrence.endDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal h-10",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Until...</span>}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add {isEpic ? 'Epic' : 'Task'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    
