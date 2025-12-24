import { format } from "date-fns";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/lib/types";

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

export function TaskItem({ task, onTaskSelect }: TaskItemProps) {
  const { label, icon: Icon } = priorityConfig[task.priority];
  const isCompleted = task.status === 'Done' || task.status === 'Cancelled';

  return (
    <TableRow
      onClick={() => onTaskSelect(task)}
      className="cursor-pointer transition-colors duration-300"
      data-state={isCompleted ? "completed" : "incomplete"}
    >
      <TableCell
        className={cn(
          "font-medium transition-colors",
          isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.description}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <Badge
          variant="outline"
          className={cn(
            "items-center gap-1.5",
            isCompleted && "opacity-60"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          "text-right text-sm text-muted-foreground transition-colors",
          !isCompleted && "text-foreground"
        )}
      >
        {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "No date"}
      </TableCell>
    </TableRow>
  );
}
