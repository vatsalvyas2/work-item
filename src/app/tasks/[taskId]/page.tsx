
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, TaskStatus, TimelineEntry, Comment, Epic } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Repeat, Plus, Send, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Mock data - in a real app, this would come from a database or state management library
const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "Set up the project structure",
      taskType: "Task",
      description: "Define the folder structure and install base dependencies.",
      priority: "high",
      status: "Done",
      dueDate: new Date("2024-08-01"),
      createdAt: new Date("2024-07-25"),
      completedAt: new Date("2024-07-28"),
      reviewRequired: false,
      timeline: [{id: "t1-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      reporter: "Vatsal Vyas"
    },
    {
      id: "task-2",
      title: "Create the main UI components",
      taskType: "Story",
      description: "Develop React components for the main layout, header, and footer.",
      priority: "high",
      status: "In Progress",
      dueDate: new Date("2024-08-05"),
      createdAt: new Date("2024-07-26"),
      actualStartDate: new Date("2024-07-29"),
      reviewRequired: true,
      assignee: "Alex",
      reviewer: "Bob",
      timeline: [{id: "t2-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [{id: "c2-1", timestamp: new Date(), text: "Can I get more info?", user: "Alex"}],
      reporter: "Vatsal Vyas",
      parentId: "epic-1",
    },
    {
      id: "task-3",
      title: "Implement task state management",
      taskType: "Task",
      description: "Use React hooks like useState and useReducer for state.",
      priority: "medium",
      status: "To Do",
      dueDate: new Date("2024-08-10"),
      createdAt: new Date("2024-07-27"),
      reviewRequired: false,
      timeline: [{id: "t3-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      reporter: "Jane Doe",
      parentId: "epic-1",
    },
    {
      id: "task-4",
      title: "Add filtering and sorting functionality",
      taskType: "Task",
      description: "Allow users to filter tasks by status and priority.",
      priority: "low",
      status: "On Hold",
      dueDate: undefined,
      createdAt: new Date("2024-07-28"),
      reviewRequired: false,
      timeline: [{id: "t4-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      reporter: "Jane Doe"
    },
    {
      id: "task-5",
      title: "Deploy the application",
      taskType: "Task",
      description: "Deploy the app to a staging environment.",
      priority: "medium",
      status: "Under Review",
      dueDate: new Date("2024-08-15"),
      createdAt: new Date("2024-07-29"),
      reviewRequired: true,
      assignee: "Charlie",
      reviewer: "David",
      timeline: [{id: "t5-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      reporter: "Vatsal Vyas"
    },
];

const mockEpics: Epic[] = [
    { id: 'epic-1', title: 'User Management Feature', project: 'SCRUM-5' }
]

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  
  // In a real app, you would fetch this data, not find it in a mock array.
  const [task, setTask] = useState<Task | null>(null);
  const [epic, setEpic] = useState<Epic | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const foundTask = mockTasks.find(t => t.id === taskId);
    if (foundTask) {
        setTask(foundTask);
        if (foundTask.parentId) {
            const foundEpic = mockEpics.find(e => e.id === foundTask.parentId);
            setEpic(foundEpic || null);
        }
    }
  }, [taskId]);

  if (!task) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  const handleAction = (newStatus: TaskStatus, details?: string) => {
    // In a real app, this would be a state update call (e.g., via Redux, Zustand, or a context API)
    console.log(`Task ${task.id} status changed to ${newStatus}`, { details });
  };
  
  const addComment = () => {
    if (!comment.trim()) return;
    const newComment: Comment = {
        id: `c-${Date.now()}`,
        timestamp: new Date(),
        text: comment,
        user: 'Current User' // placeholder
    }
    // Update task state
    setTask(prev => prev ? {...prev, comments: [...prev.comments, newComment]} : null);
    setComment('');
  }


  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <header className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
            {epic && <p className="text-sm text-muted-foreground">{epic.project} / {task.id.toUpperCase()}</p>}
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-4">
               {task.title}
               <Badge variant="outline">{task.taskType}</Badge>
            </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <main className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{task.description || 'No description provided.'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subtasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {task.subtasks.length > 0 ? (
                           <ul>
                            {task.subtasks.map(sub => <li key={sub.id}>{sub.title}</li>)}
                           </ul>
                        ) : (
                            <p className="text-muted-foreground">No subtasks.</p>
                        )}
                         <Button variant="outline" size="sm" className="mt-4"><Plus className="mr-2 h-4 w-4" />Add subtask</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="comments">
                            <TabsList>
                                <TabsTrigger value="comments">Comments</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="comments" className="mt-4">
                                <div className="space-y-4">
                                    {task.comments.map(c => (
                                        <div key={c.id} className="flex gap-3">
                                            <Avatar>
                                                <AvatarFallback>{c.user.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{c.user} <span className="text-xs text-muted-foreground font-normal">{format(c.timestamp, 'PP p')}</span></p>
                                                <p className="text-sm">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex gap-3">
                                     <Textarea 
                                        placeholder="Add a comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <Button onClick={addComment}><Send className="h-4 w-4" /></Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                <ScrollArea className="h-60 w-full">
                                    {task.timeline
                                    .slice()
                                    .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
                                    .map(entry => (
                                    <div key={entry.id} className="mb-3 text-sm">
                                        <p className="font-medium">{entry.action} <span className="text-muted-foreground">by {entry.user}</span></p>
                                        <p className="text-xs text-muted-foreground">{format(entry.timestamp, 'PPP p')}</p>
                                        {entry.details && <p className="text-xs italic text-muted-foreground pl-2">"{entry.details}"</p>}
                                    </div>
                                    ))}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

            </main>
            <aside className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Details</CardTitle>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Assignee</span>
                            <span>{task.assignee || 'Unassigned'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Reporter</span>
                            <span>{task.reporter || 'N/A'}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Priority</span>
                            <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        </div>
                        {epic && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Parent</span>
                                <span className="text-purple-600 font-semibold">{epic.title}</span>
                            </div>
                        )}
                        <Separator />
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Due Date</span>
                            <span>{task.dueDate ? format(task.dueDate, 'PPP') : 'Not set'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created</span>
                            <span>{format(task.createdAt, 'PPP')}</span>
                        </div>
                        {task.completedAt && (
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Completed</span>
                                <span>{format(task.completedAt, 'PPP')}</span>
                            </div>
                        )}
                        {task.recurrence && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Recurrence</span>
                                <span className="flex items-center gap-1"><Repeat className="h-4 w-4" /> {task.recurrence.interval}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </aside>
        </div>
    </div>
  );
}
