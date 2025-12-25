
import { format } from "date-fns";
import { ArrowUp, ArrowDown, Minus, Repeat, CheckCircle, Circle, Bug, Type } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority, TaskType } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onTaskSelect: (task: Task) => void;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  high: { label: "High", icon: ArrowUp },
  medium: { label: "Medium", icon: Minus },
  low: { label: "Low", icon: ArrowDown },
};

const taskTypeConfig: Record<TaskType, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
    'Story': { icon: CheckCircle, color: 'text-green-500' },
    'Task': { icon: Circle, color: 'text-blue-500' },
    'Bug': { icon: Bug, color: 'text-red-500' },
}

export function TaskItem({ task, onTaskSelect }: TaskItemProps) {
  const { label, icon: PriorityIcon } = priorityConfig[task.priority];
  const { icon: TypeIcon, color: typeColor } = taskTypeConfig[task.taskType];
  const isCompleted = task.status === 'Done' || task.status === 'Cancelled';
  const isOverdue = task.dueDate && new Date() > task.dueDate && !isCompleted;


  return (
    <TableRow
      onClick={() => onTaskSelect(task)}
      className="cursor-pointer transition-colors duration-300"
      data-state={isCompleted ? "completed" : "incomplete"}
    >
      <TableCell
        className={cn(
          "font-medium transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
            <TypeIcon className={cn("h-4 w-4", typeColor)} />
            <span className={cn(isCompleted && "line-through text-muted-foreground")}>{task.title}</span>
            {task.recurrence && <Repeat className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <Badge variant={task.status === 'Done' ? 'default' : isOverdue ? 'destructive' : 'secondary'}>{task.status}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <Badge
          variant="outline"
          className={cn(
            "items-center gap-1.5",
            isCompleted && "opacity-60"
          )}
        >
          <PriorityIcon className="h-3.5 w-3.5" />
          {label}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          "text-right text-sm text-muted-foreground transition-colors",
          !isCompleted && "text-foreground",
          isOverdue && "text-destructive font-bold"
        )}
      >
        {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "No date"}
      </TableCell>
    </TableRow>
  );
}
