
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, TaskStatus, TimelineEntry, Comment, Epic, Subtask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Repeat, Plus, Send, Edit, Play, ShieldAlert, Flag, Check, X, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


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
      isCritical: true,
      timeline: [{id: "t1-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      requester: "Vatsal Vyas",
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
      plannedStartDate: new Date("2024-07-28"),
      actualStartDate: new Date("2024-07-29"),
      duration: 40,
      reviewRequired: true,
      isCritical: false,
      assignee: "Alex",
      reviewer: "Bob",
      timeline: [{id: "t2-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [{id: "c2-1", timestamp: new Date(), text: "Can I get more info?", user: "Alex"}],
      requester: "Vatsal Vyas",
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
      isCritical: false,
      timeline: [{id: "t3-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
      subtasks: [],
      comments: [],
      requester: "Jane Doe",
      reporter: "Jane Doe",
      parentId: "epic-1",
    },
];

const mockEpics: Epic[] = [
    { id: 'epic-1', title: 'User Management Feature', project: 'SCRUM-5' }
]

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [epic, setEpic] = useState<Epic | null>(null);
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  
  // These would be based on logged in user
  const isAssignee = true; 
  const isReviewer = true;

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

  const handleStatusChange = (newStatus: TaskStatus) => {
    if(!task) return;
    const timelineEntry: TimelineEntry = {
        id: `tl-${Date.now()}`,
        timestamp: new Date(),
        action: `Status changed to ${newStatus}`,
        user: 'Current User'
    };
    let updatedTask = {...task, status: newStatus, timeline: [...task.timeline, timelineEntry]};
    if (newStatus === 'In Progress' && !task.actualStartDate) {
        updatedTask.actualStartDate = new Date();
    }
    if (newStatus === 'Done') {
        updatedTask.completedAt = new Date();
    }
    setTask(updatedTask);
  };
  
  const addComment = () => {
    if (!comment.trim() || !task) return;
    const newComment: Comment = {
        id: `c-${Date.now()}`,
        timestamp: new Date(),
        text: comment,
        user: 'Current User' // placeholder
    }
    setTask({...task, comments: [...task.comments, newComment]});
    setComment('');
  }

  const addSubtask = () => {
    if (!subtaskTitle.trim() || !task) return;
    const newSubtask: Subtask = {
        id: `sub-${Date.now()}`,
        title: subtaskTitle,
        status: 'To Do'
    };
    setTask({...task, subtasks: [...task.subtasks, newSubtask]});
    setSubtaskTitle('');
  }

  const toggleSubtask = (subtaskId: string) => {
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(sub => 
        sub.id === subtaskId ? {...sub, status: sub.status === 'To Do' ? 'Done' : 'To Do'} : sub
    );
    setTask({...task, subtasks: updatedSubtasks});
  }

  const renderTaskActions = () => {
      if(!task) return null;
      switch(task.status) {
          case 'To Do':
              return <Button onClick={() => handleStatusChange('In Progress')}><Play className="mr-2"/> Start Task</Button>
          case 'In Progress':
              if (task.reviewRequired && isAssignee) {
                  return <Button onClick={() => handleStatusChange('Under Review')}>Send for Review</Button>
              }
              return <Button onClick={() => handleStatusChange('Done')}><Check className="mr-2"/> Mark as Done</Button>
          case 'Under Review':
              if (isReviewer) {
                  return (
                      <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleStatusChange('In Progress')}><X className="mr-2"/> Rework</Button>
                          <Button onClick={() => handleStatusChange('Done')}><Check className="mr-2"/> Approve & Mark Done</Button>
                      </div>
                  );
              }
              return null;
           default:
               return null;
      }
  }


  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <header className="mb-6">
            <div className="flex justify-between items-start">
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                    {epic && <p className="text-sm text-muted-foreground">{epic.project} / {task.id.toUpperCase()}</p>}
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-4">
                        {task.title}
                        <Badge variant="outline">{task.taskType}</Badge>
                        {task.isCritical && <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Critical</Badge>}
                    </h1>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    {renderTaskActions()}
                </div>
            </div>
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
                        <ul className="space-y-2 mb-4">
                            {task.subtasks.map(sub => (
                                <li key={sub.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox 
                                        checked={sub.status === 'Done'} 
                                        onCheckedChange={() => toggleSubtask(sub.id)}
                                        id={`subtask-${sub.id}`}
                                    /> 
                                    <label htmlFor={`subtask-${sub.id}`} className={sub.status === 'Done' ? 'line-through text-muted-foreground' : ''}>
                                        {sub.title}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        {task.subtasks.length === 0 && <p className="text-muted-foreground text-sm mb-4">No subtasks.</p>}

                        <div className="flex gap-2">
                           <Input 
                                placeholder="Add a new subtask..."
                                value={subtaskTitle}
                                onChange={e => setSubtaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addSubtask()}
                            />
                           <Button onClick={addSubtask}><Plus className="mr-2 h-4 w-4" />Add</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="comments">
                            <TabsList>
                                <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4"/>Comments</TabsTrigger>
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
                                    {task.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
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
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Details</CardTitle>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
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
                            <span className="text-muted-foreground">Reviewer</span>
                            <span>{task.reviewer || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Reporter</span>
                            <span>{task.reporter || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Requester</span>
                            <span className="font-medium">{task.requester || 'N/A'}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Priority</span>
                            <span className="flex items-center gap-1"><Flag className="h-4 w-4" />{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        </div>
                        {epic && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Parent Epic</span>
                                <span className="text-purple-600 font-semibold">{epic.title}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Planned Start</span>
                            <span>{task.plannedStartDate ? format(task.plannedStartDate, 'PP') : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Due Date</span>
                            <span>{task.dueDate ? format(task.dueDate, 'PP') : 'Not set'}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Duration</span>
                            <span>{task.duration ? `${task.duration} hours` : 'Not set'}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created</span>
                            <span>{format(task.createdAt, 'PP')}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Actual Start</span>
                            <span>{task.actualStartDate ? format(task.actualStartDate, 'PP') : 'Not started'}</span>
                        </div>
                        {task.completedAt && (
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Completed</span>
                                <span>{format(task.completedAt, 'PP')}</span>
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
