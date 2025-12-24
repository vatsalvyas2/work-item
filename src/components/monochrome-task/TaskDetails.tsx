
'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { Repeat } from 'lucide-react';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onAction: (taskId: string, newStatus: TaskStatus, details?: string) => void;
}

export function TaskDetails({ task, onClose, onAction }: TaskDetailsProps) {
  const [reworkComment, setReworkComment] = useState('');

  const getActions = () => {
    const currentUserRole = 'assignee'; // Placeholder for role logic

    switch (task.status) {
      case 'To Do':
        return <Button onClick={() => onAction(task.id, 'In Progress')}>Start Task</Button>;
      case 'In Progress':
        return (
          <>
            <Button onClick={() => onAction(task.id, 'On Hold')}>On Hold</Button>
            {task.reviewRequired ? (
              <Button onClick={() => onAction(task.id, 'Under Review')}>Send for Review</Button>
            ) : (
              <Button onClick={() => onAction(task.id, 'Done')}>Mark as Done</Button>
            )}
          </>
        );
      case 'On Hold':
        return <Button onClick={() => onAction(task.id, 'In Progress')}>Resume</Button>;
      case 'Under Review':
        if (task.reviewer === 'David') { // Placeholder for current user check
          return (
            <>
              <div className="flex flex-col gap-2">
                <Textarea 
                  placeholder="Enter rework comments..."
                  value={reworkComment}
                  onChange={(e) => setReworkComment(e.target.value)}
                />
                <Button onClick={() => onAction(task.id, 'In Progress', reworkComment)} disabled={!reworkComment}>Rework</Button>
              </div>
              <Button onClick={() => onAction(task.id, 'Done')}>Approve (Done)</Button>
            </>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task.description}</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary">{task.status}</Badge>
            <Badge variant="outline">{task.priority}</Badge>
            {task.recurrence && (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    Recurring
                </Badge>
            )}
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm">
            <strong>Due Date:</strong> {task.dueDate ? format(task.dueDate, 'PPP') : 'Not set'}
          </div>
          {task.recurrence && (
              <div className="text-sm">
                  <strong>Repeats:</strong> {task.recurrence.interval.charAt(0).toUpperCase() + task.recurrence.interval.slice(1)}
                  {task.recurrence.endDate && ` until ${format(task.recurrence.endDate, 'PPP')}`}
              </div>
          )}
           <div className="text-sm">
            <strong>Created:</strong> {format(task.createdAt, 'PPP p')}
          </div>
          {task.actualStartDate && <div className="text-sm"><strong>Started:</strong> {format(task.actualStartDate, 'PPP p')}</div>}
          {task.completedAt && <div className="text-sm"><strong>Completed:</strong> {format(task.completedAt, 'PPP p')}</div>}
          
          <h3 className="font-semibold mt-4">Timeline</h3>
           <ScrollArea className="h-40 w-full rounded-md border p-4">
            {task.timeline
              .slice()
              .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map(entry => (
              <div key={entry.id} className="mb-2 text-sm">
                <p className="font-medium">{entry.action} <span className="text-muted-foreground">by {entry.user}</span></p>
                <p className="text-xs text-muted-foreground">{format(entry.timestamp, 'PPP p')}</p>
                {entry.details && <p className="text-xs italic text-muted-foreground pl-2">"{entry.details}"</p>}
              </div>
            ))}
          </ScrollArea>
        </div>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <div className="flex flex-wrap gap-2 justify-end">{getActions()}</div>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
