
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task, TaskStatus, TimelineEntry, Comment, Collection, Subtask, ExtensionRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Repeat, Plus, Send, Edit, Play, ShieldAlert, Flag, Check, X, MessageSquare, Pause, Ban, History, CalendarIcon, Link as LinkIcon, AlertTriangle, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { database } from '@/lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/contexts/UserContext';


export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const { currentUser } = useUser();
  
  const [task, setTask] = useState<Task | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [dependencies, setDependencies] = useState<Task[]>([]);
  const [dependents, setDependents] = useState<Task[]>([]);
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  
  const [isReworkDialogOpen, setIsReworkDialogOpen] = useState(false);
  const [reworkComment, setReworkComment] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [newDueTime, setNewDueTime] = useState('');

  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');

  useEffect(() => {
    const allTasks = database.getTasks();
    const foundTask = allTasks.find(t => t.id === taskId);

    if (foundTask) {
        setTask(foundTask);
        if (foundTask.parentId) {
            const foundCollection = database.getCollection(foundTask.parentId);
            setCollection(foundCollection || null);
        }
        
        if(foundTask.dependsOn) {
            const deps = allTasks.filter(t => foundTask.dependsOn?.includes(t.id));
            setDependencies(deps);
        }

        const foundDependents = allTasks.filter(t => t.dependsOn?.includes(foundTask.id));
        setDependents(foundDependents);

        setNewDueDate(foundTask.dueDate);
        if(foundTask.dueDate) {
          setNewDueTime(format(foundTask.dueDate, 'HH:mm'));
        }
    }
  }, [taskId]);

  const isBlocked = useMemo(() => {
    if (!task || !task.dependsOn || task.dependsOn.length === 0) return false;
    const allTasks = database.getTasks();
    return task.dependsOn.some(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'Done';
    });
  }, [task]);

  const isOverdue = useMemo(() => {
    if (!task || !task.dueDate) return false;
    return new Date() > task.dueDate && task.status !== 'Done' && task.status !== 'Cancelled';
  }, [task]);

  if (!task) {
    return <div>Loading...</div>;
  }
  
  const handleStatusChange = (newStatus: TaskStatus, details?: string, newDueDate?: Date) => {
    if(!task) return;
    
    let timelineDetails = details;
    if (newStatus === 'In Progress' && details?.startsWith('Rework requested')) {
        timelineDetails = `Rework requested. New due date: ${newDueDate ? format(newDueDate, 'PP p') : 'not set'}. Reason: ${details.split(':')[1] || ''}`;
    }

    const timelineEntry: TimelineEntry = {
        id: `tl-${Date.now()}`,
        timestamp: new Date(),
        action: `Status changed to ${newStatus}`,
        user: currentUser.name,
        details: timelineDetails
    };

    let updatedTaskData: Partial<Task> = {
        status: newStatus, 
        timeline: [...task.timeline, timelineEntry],
        dueDate: newDueDate || task.dueDate
    };

    if (newStatus === 'In Progress' && !task.actualStartDate) {
        updatedTaskData.actualStartDate = new Date();
    }
    if (newStatus === 'Done') {
        updatedTaskData.completedAt = new Date();
    }
    
    const updatedTask = database.updateTask(task.id, updatedTaskData);
    setTask(updatedTask);

    // Also update dependents
    dependents.forEach(dep => {
      const isStillBlocked = dep.dependsOn?.some(depId => {
        if(depId === task.id) return newStatus !== 'Done'; // Check against the new status
        const otherDep = database.getTask(depId);
        return otherDep && otherDep.status !== 'Done';
      });

      if (dep.status === 'Blocked' && !isStillBlocked) {
        database.updateTask(dep.id, { status: 'To Do' });
      }
    });

  };
  
  const handleReworkSubmit = () => {
    let combinedDueDate: Date | undefined = newDueDate;
    if(newDueDate && newDueTime) {
      const [hours, minutes] = newDueTime.split(':').map(Number);
      combinedDueDate = new Date(newDueDate);
      combinedDueDate.setHours(hours, minutes);
    }
    handleStatusChange('In Progress', `Rework requested: ${reworkComment}`, combinedDueDate);
    setIsReworkDialogOpen(false);
    setReworkComment('');
  }

  const addComment = () => {
    if (!comment.trim() || !task) return;
    const newComment: Comment = {
        id: `c-${Date.now()}`,
        timestamp: new Date(),
        text: comment,
        user: currentUser.name
    }
    const updatedTask = database.updateTask(task.id, {...task, comments: [...task.comments, newComment]});
    setTask(updatedTask);
    setComment('');
  }

  const addSubtask = () => {
    if (!subtaskTitle.trim() || !task) return;
    const newSubtask: Subtask = {
        id: `sub-${Date.now()}`,
        title: subtaskTitle,
        status: 'To Do'
    };
    const updatedTask = database.updateTask(task.id, {...task, subtasks: [...task.subtasks, newSubtask]});
    setTask(updatedTask);
    setSubtaskTitle('');
  }

  const toggleSubtask = (subtaskId: string) => {
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(sub => 
        sub.id === subtaskId ? {...sub, status: sub.status === 'To Do' ? 'Done' : 'To Do'} : sub
    );
    const updatedTask = database.updateTask(task.id, {...task, subtasks: updatedSubtasks});
    setTask(updatedTask);
  }

  const handleExtensionRequestSubmit = () => {
    if(!task || !newDueDate) return;
    let combinedDueDate: Date | undefined = newDueDate;
    if(newDueDate && newDueTime) {
      const [hours, minutes] = newDueTime.split(':').map(Number);
      combinedDueDate = new Date(newDueDate);
      combinedDueDate.setHours(hours, minutes);
    } else {
      return; // A new due date and time is required.
    }

    const extensionRequest: ExtensionRequest = {
      requestedAt: new Date(),
      newDueDate: combinedDueDate,
      reason: extensionReason,
      status: 'pending'
    };

    const timelineEntry: TimelineEntry = {
      id: `tl-${Date.now()}`,
      timestamp: new Date(),
      action: 'Extension Requested',
      user: currentUser.name,
      details: `New due date: ${format(combinedDueDate, 'PP p')}. Reason: ${extensionReason}`
    };

    const updatedTask = database.updateTask(task.id, { extensionRequest, timeline: [...task.timeline, timelineEntry] });
    setTask(updatedTask);
    setIsExtensionDialogOpen(false);
    setExtensionReason('');
  };

  const handleExtensionRequestResponse = (approved: boolean) => {
    if (!task || !task.extensionRequest) return;

    const newStatus = approved ? 'approved' : 'rejected';
    const action = approved ? 'Extension Approved' : 'Extension Rejected';
    const details = `Reporter responded to extension request for ${format(task.extensionRequest.newDueDate, 'PP p')}.`;

    const timelineEntry: TimelineEntry = {
        id: `tl-${Date.now()}`,
        timestamp: new Date(),
        action,
        user: currentUser.name,
        details
    };

    const updatedTaskData: Partial<Task> = {
      extensionRequest: { ...task.extensionRequest, status: newStatus },
      timeline: [...task.timeline, timelineEntry]
    };

    if (approved) {
      updatedTaskData.dueDate = task.extensionRequest.newDueDate;
    }

    const updatedTask = database.updateTask(task.id, updatedTaskData);
    setTask(updatedTask);
  };


  const renderTaskActions = () => {
      if(!task) return null;

      const isAssignee = currentUser.name === task.assignee;
      const isReporter = currentUser.role === 'reporter';
      
      const baseActions = (
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleStatusChange('On Hold')}><Pause className="mr-2"/> On Hold</Button>
            <Button variant="destructive" onClick={() => handleStatusChange('Cancelled')}><Ban className="mr-2"/> Cancel</Button>
        </div>
      );

      switch(task.status) {
          case 'To Do':
              return <div className="flex gap-2">
                {isAssignee && !task.extensionRequest && <Button variant="outline" onClick={() => setIsExtensionDialogOpen(true)}><Clock className="mr-2"/> Request Extension</Button>}
                {isAssignee && <Button onClick={() => handleStatusChange('In Progress')} disabled={isBlocked}><Play className="mr-2"/> Start Work Item</Button>}
                {isAssignee && baseActions}
              </div>
          case 'Blocked':
              return <div className="flex gap-2">
                <Button disabled><Play className="mr-2"/> Start Work Item</Button>
                {isAssignee && baseActions}
              </div>
          case 'In Progress':
              return <div className="flex gap-2">
                  {task.reviewRequired && isAssignee && <Button onClick={() => handleStatusChange('Under Review')}>Send for Review</Button>}
                  {!task.reviewRequired && isAssignee && <Button onClick={() => handleStatusChange('Done')}><Check className="mr-2"/> Mark as Done</Button>}
                  {isAssignee && baseActions}
              </div>
          case 'On Hold':
             return <div className="flex gap-2">
                {isAssignee && <Button onClick={() => handleStatusChange('In Progress')}><Play className="mr-2"/> Resume</Button>}
                {isAssignee && <Button variant="destructive" onClick={() => handleStatusChange('Cancelled')}><Ban className="mr-2"/> Cancel</Button>}
            </div>
          case 'Under Review':
              if (isReporter) {
                  return (
                      <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsReworkDialogOpen(true)}><X className="mr-2"/> Rework</Button>
                          <Button onClick={() => handleStatusChange('Done')}><Check className="mr-2"/> Approve & Mark Done</Button>
                      </div>
                  );
              }
              return null;
           case 'Done':
           case 'Cancelled':
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
                    {collection && <p className="text-sm text-muted-foreground">{collection.project} / {task.id.toUpperCase()}</p>}
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-4">
                        {task.title}
                    </h1>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    {renderTaskActions()}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <main className="lg:col-span-2 space-y-6">
                {isOverdue && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Work Item Overdue</AlertTitle>
                        <AlertDescription>
                            This work item is past its due date of {format(task.dueDate!, 'PP')}.
                        </AlertDescription>
                    </Alert>
                )}

                {task.extensionRequest?.status === 'pending' && currentUser.role === 'reporter' && (
                    <Alert variant="default" className="border-yellow-400 bg-yellow-50">
                        <Clock className="h-4 w-4 !text-yellow-600" />
                        <AlertTitle className="text-yellow-800">Extension Request Pending</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                            The assignee has requested a new due date of <strong>{format(task.extensionRequest.newDueDate, 'PPp')}</strong>.
                            {task.extensionRequest.reason && <p className="mt-1 italic">Reason: "{task.extensionRequest.reason}"</p>}
                            <div className="mt-4 flex gap-2">
                                <Button size="sm" onClick={() => handleExtensionRequestResponse(true)}><ThumbsUp className="mr-2" /> Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleExtensionRequestResponse(false)}><ThumbsDown className="mr-2" /> Reject</Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{task.description || 'No description provided.'}</p>
                    </CardContent>
                </Card>

                {(dependencies.length > 0 || dependents.length > 0) && (
                    <Card>
                         <CardHeader>
                            <CardTitle>Dependencies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dependencies.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-sm mb-2">Blocked By</h4>
                                    <ul className="space-y-1">
                                        {dependencies.map(dep => (
                                             <li key={dep.id} className="text-sm flex items-center gap-2">
                                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                <Link href={`/tasks/${dep.id}`} className={cn("hover:underline", dep.status === 'Done' ? 'line-through text-green-600' : '')}>
                                                    {dep.title}
                                                </Link>
                                                <Badge variant={dep.status === 'Done' ? 'default' : 'secondary'}>{dep.status}</Badge>
                                             </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {dependents.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Blocking</h4>
                                    <ul className="space-y-1">
                                        {dependents.map(dep => (
                                             <li key={dep.id} className="text-sm flex items-center gap-2">
                                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                <Link href={`/tasks/${dep.id}`} className="hover:underline">
                                                    {dep.title}
                                                </Link>
                                                <Badge variant={dep.status === 'Done' ? 'default' : 'secondary'}>{dep.status}</Badge>
                                             </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

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
                                <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>History</TabsTrigger>
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
                            <Badge variant={task.status === 'Done' ? 'default' : task.status === 'Blocked' ? 'destructive' : 'secondary'}>{task.status}</Badge>
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
                        {collection && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Parent Collection</span>
                                <Link href={`/collections/${collection.id}`} className="text-purple-600 font-semibold hover:underline">{collection.title}</Link>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className={cn(isOverdue && 'text-destructive font-bold')}>
                                {task.dueDate ? format(task.dueDate, 'PPp') : 'Not set'}
                            </span>
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
                        {task.extensionRequest && (
                           <>
                            <Separator/>
                            <div className="space-y-2">
                                <span className="text-muted-foreground">Extension Request</span>
                                <div className={cn("p-2 rounded-md border text-xs", 
                                    task.extensionRequest.status === 'pending' && "bg-yellow-50 border-yellow-200",
                                    task.extensionRequest.status === 'approved' && "bg-green-50 border-green-200",
                                    task.extensionRequest.status === 'rejected' && "bg-red-50 border-red-200"
                                )}>
                                    <p><strong>Status:</strong> <span className="capitalize">{task.extensionRequest.status}</span></p>
                                    <p><strong>Requested Date:</strong> {format(task.extensionRequest.newDueDate, 'PPp')}</p>
                                    <p><strong>Original Date:</strong> {task.dueDate ? format(task.dueDate, 'PPp') : 'N/A'}</p>
                                </div>
                            </div>
                           </>
                        )}
                    </CardContent>
                </Card>
            </aside>
        </div>

        <Dialog open={isReworkDialogOpen} onOpenChange={setIsReworkDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Rework</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rework-comment">Reason for Rework</Label>
                        <Textarea 
                            id="rework-comment"
                            placeholder="Provide feedback for the assignee..."
                            value={reworkComment}
                            onChange={(e) => setReworkComment(e.target.value)}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>New Due Date</Label>
                             <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal h-10",
                                      !newDueDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newDueDate ? format(newDueDate, "PPP") : <span>Pick a date</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={newDueDate}
                                  onSelect={setNewDueDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label>New Due Time</Label>
                            <Input 
                                type="time"
                                value={newDueTime}
                                onChange={(e) => setNewDueTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleReworkSubmit} disabled={!reworkComment.trim() || !newDueDate}>Submit Rework</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isExtensionDialogOpen} onOpenChange={setIsExtensionDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Extension</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>New Due Date</Label>
                             <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal h-10",
                                      !newDueDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newDueDate ? format(newDueDate, "PPP") : <span>Pick a date</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={newDueDate}
                                  onSelect={setNewDueDate}
                                  disabled={(date) => date < (task.dueDate || new Date())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label>New Due Time</Label>
                            <Input 
                                type="time"
                                value={newDueTime}
                                onChange={(e) => setNewDueTime(e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="extension-reason">Reason (optional)</Label>
                        <Textarea 
                            id="extension-reason"
                            placeholder="Why do you need an extension?"
                            value={extensionReason}
                            onChange={(e) => setExtensionReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleExtensionRequestSubmit} disabled={!newDueDate || !newDueTime}>Send Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
