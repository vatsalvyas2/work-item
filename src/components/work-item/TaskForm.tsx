
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Check, ChevronsUpDown, Mic, Square, Loader2, Send } from "lucide-react";

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
      reporter: "Current User",
      requester: "",
      dueDate: "",
    },
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
        dueDate: result.dueDate ? format(parseISO(result.dueDate + (result.dueTime ? 'T' + result.dueTime : '')), "yyyy-MM-dd'T'HH:mm") : undefined,
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
  
  const handleSubmit = (data: FormValues) => {
    const { ...taskData } = data;
    
    let finalDueDate: Date | undefined = taskData.dueDate ? new Date(taskData.dueDate) : undefined;

    const recurrencePayload = taskData.isRecurring && taskData.recurrence ? {
        ...taskData.recurrence,
        daysOfWeek: taskData.recurrence.daysOfWeek?.map(d => parseInt(d)),
        monthly: {
            ...taskData.recurrence.monthly!,
            weekdays: taskData.recurrence.monthly!.weekdays!.map(wd => ({...wd, day: parseInt(wd.day)}))
        },
        yearly: {
            ...taskData.recurrence.yearly!,
            dates: taskData.recurrence.yearly!.dates!.map(d => ({ month: d.getMonth(), day: d.getDate() })),
            weekdays: taskData.recurrence.yearly!.weekdays!.map(wd => ({...wd, day: parseInt(wd.day), month: parseInt(wd.month) }))
        }
    } : undefined;

    onTaskSubmit({
      ...taskData,
      taskType: 'Task', // Defaulting to 'Task' as type is removed
      parentId: taskData.parentId === 'none' ? undefined : taskData.parentId,
      dueDate: finalDueDate,
      recurrence: recurrencePayload,
    });


    form.reset();
  };

  const availableTasksForDepencency = tasks.filter(t => t.status !== 'Done' && t.status !== 'Cancelled');
  
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder={"e.g., Finish the report"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
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
                          <FormControl>
                            <Input placeholder="e.g., Jane Doe" {...field} value={field.value || ''} />
                          </FormControl>
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
                            <Input placeholder="e.g., Vatsal Vyas" {...field} value={field.value || ''}/>
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
                            <Input readOnly {...field} value={field.value || ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  {!isRecurring && (
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
                  )}
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
                                        initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        {form.watch("recurrence.interval") === 'weekly' && (
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
