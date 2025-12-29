
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Task, FilterStatus, FilterPriority, TaskStatus, Collection } from "@/lib/types";
import { TaskList } from "@/components/work-item/TaskList";
import { FilterControls } from "@/components/work-item/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/work-item/TaskForm";
import { useUser } from "@/contexts/UserContext";


export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { currentUser } = useUser();

  useEffect(() => {
    setTasks(database.getTasks());
    setCollections(database.getCollections());
  }, [currentUser]);

  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  const addTask = (task: Omit<Task, "id" | "status" | "createdAt" | "timeline" | "subtasks" | "comments" >) => {
    database.addTask(task);
    setTasks([...database.getTasks()]);
    setIsFormOpen(false);
  };

  const handleSelectTask = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    const statusOrder: Record<TaskStatus, number> = {
        'Blocked': 0,
        'To Do': 1,
        'In Progress': 2,
        'On Hold': 3,
        'Under Review': 4,
        'Done': 5,
        'Cancelled': 6
    }

    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityComparison !== 0) return priorityComparison;
      }
      
      const statusComparison = statusOrder[a.status] - statusOrder[b.status];
      if(statusComparison !== 0) return statusComparison;

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    return filtered;
  }, [tasks, statusFilter, priorityFilter, sortBy]);

  return (
    <div className="space-y-8">
        <section>
            <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Your Work Items</CardTitle>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Work Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Create Work Item</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 max-h-[80vh] overflow-y-auto">
                            <TaskForm 
                                onTaskSubmit={addTask} 
                                collections={collections}
                                tasks={tasks}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
                <FilterControls
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                />
            </CardHeader>
            <CardContent>
                <TaskList
                tasks={filteredAndSortedTasks}
                onTaskSelect={handleSelectTask}
                />
            </CardContent>
            </Card>
        </section>
    </div>
  );
}
