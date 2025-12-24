import { format } from "date-fns";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  high: { label: "High", icon: ArrowUp },
  medium: { label: "Medium", icon: Minus },
  low: { label: "Low", icon: ArrowDown },
};

export function TaskItem({ task, onToggleComplete }: TaskItemProps) {
  const { label, icon: Icon } = priorityConfig[task.priority];

  return (
    <TableRow
      data-state={task.completed ? "completed" : "incomplete"}
      className="transition-colors duration-300"
    >
      <TableCell>
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          aria-label={`Mark task "${task.description}" as ${
            task.completed ? "incomplete" : "complete"
          }`}
        />
      </TableCell>
      <TableCell
        className={cn(
          "font-medium transition-colors",
          task.completed && "line-through text-muted-foreground"
        )}
      >
        {task.description}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <Badge
          variant="outline"
          className={cn(
            "items-center gap-1.5",
            task.completed && "opacity-60"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          "text-right text-sm text-muted-foreground transition-colors",
          !task.completed && "text-foreground"
        )}
      >
        {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "No date"}
      </TableCell>
    </TableRow>
  );
}
