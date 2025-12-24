"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TaskPriority, TaskStatus } from "@/lib/types";

interface FilterControlsProps {
  statusFilter: TaskStatus;
  setStatusFilter: (status: TaskStatus) => void;
  priorityFilter: TaskPriority | "all";
  setPriorityFilter: (priority: TaskPriority | "all") => void;
  sortBy: "dueDate" | "priority";
  setSortBy: (sortBy: "dueDate" | "priority") => void;
}

export function FilterControls({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 pt-4 border-t mt-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-sm">Filter by</Label>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TaskStatus)}
        >
          <SelectTrigger id="status-filter" className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={priorityFilter}
          onValueChange={(value) =>
            setPriorityFilter(value as TaskPriority | "all")
          }
        >
          <SelectTrigger id="priority-filter" className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <Label htmlFor="sort-by" className="text-sm">Sort by</Label>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "dueDate" | "priority")}
        >
          <SelectTrigger id="sort-by" className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
