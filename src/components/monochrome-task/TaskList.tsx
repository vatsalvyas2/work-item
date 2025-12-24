import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskItem } from "./TaskItem";
import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleComplete }: TaskListProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="hidden sm:table-cell w-[120px] text-center">Priority</TableHead>
            <TableHead className="w-[150px] text-right">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No tasks found. Time to relax or create a new one!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {tasks.length > 0 && <TableCaption>A list of your tasks.</TableCaption>}
      </Table>
    </div>
  );
}
