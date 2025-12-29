
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO, addMonths } from "date-fns";
import { CalendarIcon, Plus, Check, ChevronsUpDown, Mic, Square, Loader2, Send, Trash2 } from "lucide-react";

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
import type { Task, Collection, TaskType } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { createTaskFromVoice } from "@/ai/flows/create-task-flow";
import { transcribeAudio } from "@/ai/flows/transcribe-audio-flow";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";


const monthlyWeekdaySchema = z.object({
    order: z.enum(['First', 'Second', 'Third', 'Fourth', 'Last']),
    day: z.string().nonempty(), // Using string because zod enums don't play well with number-like strings from <select>
});

const monthlySchema = z.object({
    mode: z.enum(['onDate', 'onWeekday']),
    dates: z.array(z.number().min(1).max(31)).optional(),
    weekdays: z.array(monthlyWeekdaySchema).optional(),
});

const yearlyWeekdaySchema = z.object({
    order: z.enum(['First', 'Second', 'Third', 'Fourth', 'Last']),
    day: z.string().nonempty(),
    month: z.string().nonempty(),
});

const yearlySchema = z.object({
    mode: z.enum(['onDate', 'onWeekday']),
    dates: z.array(z.date()).optional(),
    weekdays: z.array(yearlyWeekdaySchema).optional(),
});


const recurrenceSchema = z.object({
    interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.string()).optional(),
    monthly: monthlySchema.optional(),
    yearly: yearlySchema.optional(),
}).optional();


const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  taskType: z.enum(['Story', 'Task', 'Bug']),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  reviewRequired: z.boolean().default(false),
  reviewer: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: recurrenceSchema,
  parentId: z.string().optional(),
  dependsOn: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  requester: z.string().optional(),
  reporter: z.string().optional(),
}).refine(data => {
    if (data.isRecurring) {
        return !!data.recurrence?.interval;
    }
    return true;
}, {
    message: "Recurrence interval is required for recurring tasks.",
    path: ["recurrence.interval"],
}).refine(data => {
    if (data.reviewRequired) {
        return !!data.reviewer && data.reviewer.length > 0;
    }
    return true;
}, {
    message: "Reviewer name is required.",
    path: ["reviewer"],
});

type FormValues = z.infer<typeof formSchema>;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK_ORDER: ('First' | 'Second' | 'Third' | 'Fourth' | 'Last')[] = ['First', 'Second', 'Third', 'Fourth', 'Last'];


interface TaskFormProps {
  onTaskSubmit: (data: Omit<Task, "id" | "status" | "createdAt" | "timeline" | "subtasks" | "comments" >) => void;
  collections: Collection[];
  tasks: Task[];
}

export function TaskForm({ onTaskSubmit, collections, tasks }: TaskFormProps) {
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMicSupported, setIsMicSupported] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const { currentUser, users } = useUser();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsMicSupported(false);
        }
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      taskType: "Task",
      priority: "medium",
      reviewRequired: false,
      reviewer: "",
      isRecurring: false,
      recurrence: {
        interval: 'daily',
        daysOfWeek: [],
        monthly: {
            mode: 'onDate',
            dates: [],
            weekdays: [{ order: 'First', day: '1' }],
        },
        yearly: {
            mode: 'onDate',
            dates: [],
            weekdays: [{ order: 'First', day: '1', month: '0' }],
        }
      },
      parentId: "none",
      dependsOn: [],
      assignee: "",
      reporter: "",
      requester: "",
      dueDate: "",
    },
  });
  
  useEffect(() => {
    if (currentUser.role === 'reporter') {
      form.setValue('reporter', currentUser.name);
    } else if (currentUser.role === 'assignee') {
      form.setValue('reporter', currentUser.name);
      form.setValue('requester', currentUser.name);
      form.setValue('assignee', currentUser.name);
    }
  }, [currentUser, form]);

  const { fields: monthlyWeekdayFields, append: appendMonthlyWeekday, remove: removeMonthlyWeekday } = useFieldArray({
      control: form.control,
      name: "recurrence.monthly.weekdays"
  });
   const { fields: monthlyDateFields, append: appendMonthlyDate, remove: removeMonthlyDate } = useFieldArray({
      control: form.control,
      name: "recurrence.monthly.dates"
  });

  const { fields: yearlyWeekdayFields, append: appendYearlyWeekday, remove: removeYearlyWeekday } = useFieldArray({
      control: form.control,
      name: "recurrence.yearly.weekdays"
  });
  const { fields: yearlyDateFields, append: appendYearlyDate, remove: removeYearlyDate } = useFieldArray({
      control: form.control,
      name: "recurrence.yearly.dates"
  });

  const onAiSubmit = (result: Partial<FormValues>) => {
      form.reset(); // Clear form before applying new values

      if (result.title) form.setValue("title", result.title);
      if (result.description) form.setValue("description", result.description);
      if (result.priority) form.setValue("priority", result.priority);
      if (result.assignee) form.setValue("assignee", result.assignee);
      if (result.reporter) form.setValue("reporter", result.reporter);
      if (result.requester) form.setValue("requester", result.requester);
      if (result.dueDate) form.setValue("dueDate", result.dueDate);
      if (result.reviewRequired) form.setValue("reviewRequired", result.reviewRequired);
      if (result.reviewer) form.setValue("reviewer", result.reviewer);
      if (result.parentId) form.setValue("parentId", result.parentId);
      if (result.dependsOn) form.setValue("dependsOn", result.dependsOn);
      if (result.isRecurring) form.setValue("isRecurring", result.isRecurring);
      if (result.recurrence?.interval) form.setValue("recurrence.interval", result.recurrence.interval);
      if (result.recurrence?.endDate) form.setValue("recurrence.endDate", parseISO(result.recurrence.endDate as any));
      if (result.recurrence?.daysOfWeek) form.setValue("recurrence.daysOfWeek", result.recurrence.daysOfWeek.map(String));
      
      if (result.recurrence?.monthly) {
        form.setValue("recurrence.monthly.mode", result.recurrence.monthly.mode);
        if(result.recurrence.monthly.mode === 'onDate' && result.recurrence.monthly.dates) {
          form.setValue("recurrence.monthly.dates", result.recurrence.monthly.dates);
        }
        if(result.recurrence.monthly.mode === 'onWeekday' && result.recurrence.monthly.weekdays) {
          form.setValue("recurrence.monthly.weekdays", result.recurrence.monthly.weekdays.map(d => ({...d, day: String(d.day)})));
        }
      }
      if (result.recurrence?.yearly) {
        form.setValue("recurrence.yearly.mode", result.recurrence.yearly.mode);
        if(result.recurrence.yearly.mode === 'onDate' && result.recurrence.yearly.dates) {
          form.setValue("recurrence.yearly.dates", result.recurrence.yearly.dates.map(d => new Date(new Date().getFullYear(), d.month, d.day)));
        }
        if(result.recurrence.yearly.mode === 'onWeekday' && result.recurrence.yearly.weekdays) {
           form.setValue("recurrence.yearly.weekdays", result.recurrence.yearly.weekdays.map(d => ({...d, day: String(d.day), month: String(d.month)})));
        }
      }
  };

  const startRecording = async () => {
    setTranscript('');
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond : 16000,
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setIsTranscribing(true);
            try {
                const transcription = await transcribeAudio({ audioDataUri: base64Audio });
                setTranscript(transcription);
            } catch (error) {
                console.error("Transcription error:", error);
                setTranscript("Sorry, I couldn't transcribe that. Please try again.");
            } finally {
                setIsTranscribing(false);
            }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsMicSupported(false); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAiSubmit = async () => {
    if (!transcript.trim()) return;

    setIsAiProcessing(true);
    try {
      const result = await createTaskFromVoice({
        command: transcript,
        availableCollections: collections.map(c => ({ id: c.id, title: c.title })),
        availableTasks: tasks.map(t => ({ id: t.id, title: t.title })),
        currentDate: new Date().toISOString(),
      });
      
      const populatedResult = {
        ...result,
        dueDate: result.dueDate ? format(parseISO(result.dueDate), "yyyy-MM-dd'T'HH:mm") : undefined,
      };
      
      onAiSubmit(populatedResult as Partial<FormValues>);
      setTranscript('');
      setIsVoicePanelOpen(false);
    } catch (error) {
      console.error("Error processing voice command:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const isRecurring = form.watch("isRecurring");
  const reviewRequired = form.watch("reviewRequired");
  const requester = form.watch("requester");

  useEffect(() => {
      if (reviewRequired && requester && !form.getValues("reviewer")) {
          form.setValue("reviewer", requester);
      }
  }, [reviewRequired, requester, form]);
  
  const handleSubmit = (data: FormValues) => {
    
    let finalDueDate: Date | undefined;

    if(data.dueDate) {
        finalDueDate = new Date(data.dueDate);
    } 

    const recurrencePayload = data.isRecurring && data.recurrence ? {
        ...data.recurrence,
        daysOfWeek: data.recurrence.daysOfWeek?.map(d => parseInt(d)),
        monthly: data.recurrence.monthly ? {
            ...data.recurrence.monthly,
            weekdays: data.recurrence.monthly.weekdays?.map(wd => ({...wd, day: parseInt(wd.day)}))
        } : undefined,
        yearly: data.recurrence.yearly ? {
            ...data.recurrence.yearly,
            dates: data.recurrence.yearly.dates?.map(d => ({ month: d.getMonth(), day: d.getDate() })),
            weekdays: data.recurrence.yearly.weekdays?.map(wd => ({...wd, day: parseInt(wd.day), month: parseInt(wd.month) }))
        } : undefined
    } : undefined;

    onTaskSubmit({
      ...data,
      taskType: data.taskType as TaskType,
      parentId: data.parentId === 'none' ? undefined : data.parentId,
      dueDate: finalDueDate,
      recurrence: recurrencePayload,
    });


    form.reset();
  };

  const availableTasksForDepencency = tasks.filter(t => t.status !== 'Done' && t.status !== 'Cancelled');
  const recurrenceInterval = form.watch("recurrence.interval");
  const monthlyMode = form.watch("recurrence.monthly.mode");
  const yearlyMode = form.watch("recurrence.yearly.mode");
  const assignees = users; // Both can be assignees
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create a New Work Item</CardTitle>
         <Button variant="outline" onClick={() => setIsVoicePanelOpen(prev => !prev)}>
            <Mic className="mr-2 h-4 w-4" />
            Auto Fill by Voice
        </Button>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
           {isVoicePanelOpen && (
              <CardContent className="space-y-3 border-b pb-6">
                <h3 className="text-sm font-medium text-muted-foreground">Voice Command</h3>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    className="rounded-full flex-shrink-0"
                    onClick={handleToggleRecording}
                    disabled={!isMicSupported || isAiProcessing || isTranscribing}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? <Square /> : <Mic />}
                  </Button>
                  <div className="w-full p-3 bg-muted rounded-md text-sm min-h-[40px] flex items-center">
                    {isRecording ? (
                        <div className="flex items-center gap-2 text-muted-foreground w-full">
                           <span className="text-red-500 animate-pulse">&#9679;</span>
                           <span>Recording...</span>
                           <span className="ml-auto font-mono">{formatTime(recordingTime)}</span>
                        </div>
                    ) : isTranscribing ? (
                       <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Transcribing...</span>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">
                            {transcript || "Click the mic to start recording..."}
                        </p>
                    )}
                  </div>
                   <Button type="button" onClick={handleAiSubmit} disabled={!transcript.trim() || isAiProcessing || isRecording || isTranscribing}>
                        {isAiProcessing ? <Loader2 className="animate-spin" /> : <Send />}
                  </Button>
                </div>
              </CardContent>
            )}
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <FormItem className="md:col-span-3">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder={"e.g., Finish the report"} {...field} />
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
                    <Textarea placeholder="Add a more detailed description..." {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''} disabled={currentUser.role === 'assignee'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assignees.map(assignee => (
                              <SelectItem key={assignee.name} value={assignee.name}>{assignee.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <FormField
                      control={form.control}
                      name="requester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requester</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Vatsal Vyas" {...field} value={field.value || ''} disabled={currentUser.role === 'assignee'}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reporter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporter</FormLabel>
                          <FormControl>
                            <Input readOnly {...field} value={field.value || ''} disabled={currentUser.role === 'assignee'}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                   <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Due Date & Time</FormLabel>
                          <FormControl>
                              <Input type="datetime-local" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Collection</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to a collection (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Collection</SelectItem>
                            {collections.map(collection => (
                              <SelectItem key={collection.id} value={collection.id}>{collection.title}</SelectItem>
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
                                  "w-full justify-between h-10",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                              >
                                {field.value?.length 
                                  ? `${field.value.length} selected`
                                  : "Select work items"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search work items..." />
                              <CommandList>
                                <CommandEmpty>No work items found.</CommandEmpty>
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


                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="reviewRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              id="review-required"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel htmlFor="review-required" className="!mt-0">Review Required</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="isRecurring"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                                <FormControl>
                                    <Switch
                                    id="recurring-task"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel htmlFor="recurring-task" className="!mt-0">Recurring Work Item</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>

                {reviewRequired && (
                     <FormField
                      control={form.control}
                      name="reviewer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reviewer</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Alice" {...field} value={field.value || ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}

                {isRecurring && (
                    <div className="space-y-4 rounded-lg border p-4 pt-2 shadow-sm">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Due Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} value={field.value ? field.value.split('T')[1] : ''} 
                                          onChange={(e) => {
                                            const time = e.target.value;
                                            const currentDate = field.value ? field.value.split('T')[0] : new Date().toISOString().split('T')[0];
                                            field.onChange(`${currentDate}T${time}`);
                                          }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <div className="grid grid-cols-1">
                             <FormField
                                control={form.control}
                                name="recurrence.endDate"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Repeat Until</FormLabel>
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
                                            {field.value ? format(field.value, "PPP") : <span>Optional: End date</span>}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0)) || date > addMonths(new Date(), 6)
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        {recurrenceInterval === 'weekly' && (
                             <FormField
                                control={form.control}
                                name="recurrence.daysOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>On</FormLabel>
                                        <FormControl>
                                            <ToggleGroup type="multiple" variant="outline" className="flex-wrap justify-start" value={field.value} onValueChange={field.onChange}>
                                                {WEEKDAYS.map((day, index) => (
                                                    <ToggleGroupItem key={day} value={index.toString()}>{day}</ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {recurrenceInterval === 'monthly' && (
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="recurrence.monthly.mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mode</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="onDate">On Date</SelectItem>
                                                    <SelectItem value="onWeekday">On Weekday</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                {monthlyMode === 'onDate' && (
                                    <div className="space-y-2">
                                        <Label>Date of the month</Label>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                <Button
                                                    key={day}
                                                    type="button"
                                                    variant={form.getValues('recurrence.monthly.dates')?.includes(day) ? 'default' : 'outline'}
                                                    onClick={() => {
                                                        const currentDates = form.getValues('recurrence.monthly.dates') || [];
                                                        if (currentDates.includes(day)) {
                                                            form.setValue('recurrence.monthly.dates', currentDates.filter(d => d !== day));
                                                        } else {
                                                            form.setValue('recurrence.monthly.dates', [...currentDates, day].sort((a,b) => a-b));
                                                        }
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                >{day}</Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {monthlyMode === 'onWeekday' && (
                                    <div className="space-y-2">
                                        {monthlyWeekdayFields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                <FormField control={form.control} name={`recurrence.monthly.weekdays.${index}.order`} render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                                        {WEEK_ORDER.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                    </SelectContent></Select>
                                                )}/>
                                                <FormField control={form.control} name={`recurrence.monthly.weekdays.${index}.day`} render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                                        {WEEKDAYS.map((d, i) => <SelectItem key={d} value={i.toString()}>{d}</SelectItem>)}
                                                    </SelectContent></Select>
                                                )}/>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeMonthlyWeekday(index)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendMonthlyWeekday({order: 'First', day: '1'})}>Add Rule</Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {recurrenceInterval === 'yearly' && (
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="recurrence.yearly.mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mode</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="onDate">On Date</SelectItem>
                                                    <SelectItem value="onWeekday">On Weekday</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                {yearlyMode === 'onDate' && (
                                     <div className="space-y-2">
                                        {yearlyDateFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`recurrence.yearly.dates.${index}`}
                                                    render={({ field }) => (
                                                        <Popover><PopoverTrigger asChild><FormControl>
                                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                <CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd MMM") : <span>Pick a date</span>}
                                                            </Button>
                                                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                                    )}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeYearlyDate(index)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendYearlyDate(new Date())}>Add Date</Button>
                                    </div>
                                )}
                                {yearlyMode === 'onWeekday' && (
                                    <div className="space-y-2">
                                        {yearlyWeekdayFields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                                <FormField control={form.control} name={`recurrence.yearly.weekdays.${index}.order`} render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                                        {WEEK_ORDER.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                    </SelectContent></Select>
                                                )}/>
                                                <FormField control={form.control} name={`recurrence.yearly.weekdays.${index}.day`} render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                                        {WEEKDAYS.map((d, i) => <SelectItem key={d} value={i.toString()}>{d}</SelectItem>)}
                                                    </SelectContent></Select>
                                                )}/>
                                                <FormField control={form.control} name={`recurrence.yearly.weekdays.${index}.month`} render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                                        {MONTHS.map((m, i) => <SelectItem key={m} value={i.toString()}>{m}</SelectItem>)}
                                                    </SelectContent></Select>
                                                )}/>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeYearlyWeekday(index)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendYearlyWeekday({order: 'First', day: '1', month: '0'})}>Add Rule</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
              </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              Save
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
    </>
  );
}
