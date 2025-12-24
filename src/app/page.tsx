"use client";

import { useState, useMemo } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { TaskForm } from "@/components/monochrome-task/TaskForm";
import { TaskList } from "@/components/monochrome-task/TaskList";
import { FilterControls } from "@/components/monochrome-task/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      description: "Set up the project structure",
      priority: "high",
      completed: true,
      dueDate: new Date("2024-08-01"),
    },
    {
      id: "task-2",
      description: "Create the main UI components",
      priority: "high",
      completed: false,
      dueDate: new Date("2024-08-05"),
    },
    {
      id: "task-3",
      description: "Implement task state management",
      priority: "medium",
      completed: false,
      dueDate: new Date("2024-08-10"),
    },
    {
      id: "task-4",
      description: "Add filtering and sorting functionality",
      priority: "low",
      completed: false,
      dueDate: undefined,
    },
    {
      id: "task-5",
      description: "Deploy the application",
      priority: "medium",
      completed: false,
      dueDate: new Date("2024-08-15"),
    },
  ]);

  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  const addTask = (task: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) =>
        statusFilter === "completed" ? task.completed : !task.completed
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });

    return filtered;
  }, [tasks, statusFilter, priorityFilter, sortBy]);

  return (
    <div className="bg-background text-foreground min-h-screen font-body">
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight font-headline">
            MonochromeTask
          </h1>
          <p className="text-muted-foreground mt-2">
            A minimalist approach to task management.
          </p>
        </header>

        <section className="mb-8">
          <TaskForm onSubmit={addTask} />
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <CardTitle>Your Tasks</CardTitle>
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
                onToggleComplete={toggleTaskCompletion}
              />
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Built with a focus on clarity and simplicity.
      </footer>
    </div>
  );
}
