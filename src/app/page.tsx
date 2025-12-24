"use client";

import { useState, useMemo } from "react";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { Task, FilterStatus, FilterPriority, TaskStatus, TimelineEntry } from "@/lib/types";
import { TaskForm } from "@/components/monochrome-task/TaskForm";
import { TaskList } from "@/components/monochrome-task/TaskList";
import { FilterControls } from "@/components/monochrome-task/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetails } from "@/components/monochrome-task/TaskDetails";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      description: "Set up the project structure",
      priority: "high",
      status: "Done",
      dueDate: new Date("2024-08-01"),
      createdAt: new Date("2024-07-25"),
      completedAt: new Date("2024-07-28"),
      reviewRequired: false,
      timeline: [{id: "t1-1", timestamp: new Date(), action: "Task Created", user: "Admin"}]
    },
    {
      id: "task-2",
      description: "Create the main UI components",
      priority: "high",
      status: "In Progress",
      dueDate: new Date("2024-08-05"),
      createdAt: new Date("2024-07-26"),
      actualStartDate: new Date("2024-07-29"),
      reviewRequired: true,
      assignee: "Alex",
      reviewer: "Bob",
      timeline: [{id: "t2-1", timestamp: new Date(), action: "Task Created", user: "Admin"}]
    },
    {
      id: "task-3",
      description: "Implement task state management",
      priority: "medium",
      status: "To Do",
      dueDate: new Date("2024-08-10"),
      createdAt: new Date("2024-07-27"),
      reviewRequired: false,
      timeline: [{id: "t3-1", timestamp: new Date(), action: "Task Created", user: "Admin"}]
    },
    {
      id: "task-4",
      description: "Add filtering and sorting functionality",
      priority: "low",
      status: "On Hold",
      dueDate: undefined,
      createdAt: new Date("2024-07-28"),
      reviewRequired: false,
      timeline: [{id: "t4-1", timestamp: new Date(), action: "Task Created", user: "Admin"}]
    },
    {
      id: "task-5",
      description: "Deploy the application",
      priority: "medium",
      status: "Under Review",
      dueDate: new Date("2024-08-15"),
      createdAt: new Date("2024-07-29"),
      reviewRequired: true,
      assignee: "Charlie",
      reviewer: "David",
      timeline: [{id: "t5-1", timestamp: new Date(), action: "Task Created", user: "Admin"}]
    },
  ]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");
  
  const logTimelineEntry = (taskId: string, action: string, details?: string): TimelineEntry => {
    return {
      id: `tl-${Date.now()}`,
      timestamp: new Date(),
      action,
      details,
      user: "System", // Placeholder
    };
  };

  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id'>>, timelineEntry?: Omit<TimelineEntry, 'id' | 'timestamp'>) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const newTimeline = [...task.timeline];
        if (timelineEntry) {
           newTimeline.push({
             id: `tl-${Date.now()}`,
             timestamp: new Date(),
             ...timelineEntry
           })
        }
        const updatedTask = { ...task, ...updates, timeline: newTimeline };
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
        return updatedTask;
      }
      return task;
    }));
  };

  const addTask = (task: Omit<Task, "id" | "status" | "createdAt" | "timeline" >) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      status: "To Do",
      createdAt: new Date(),
      timeline: [{ id: `tl-${Date.now()}`, timestamp: new Date(), action: "Task Created", user: "System" }],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const createNextRecurringTask = (task: Task) => {
    if (!task.recurrence || !task.dueDate) return;

    const { interval, endDate } = task.recurrence;
    let nextDueDate: Date;

    switch (interval) {
        case 'daily': nextDueDate = addDays(task.dueDate, 1); break;
        case 'weekly': nextDueDate = addWeeks(task.dueDate, 1); break;
        case 'monthly': nextDueDate = addMonths(task.dueDate, 1); break;
        case 'yearly': nextDueDate = addYears(task.dueDate, 1); break;
        default: return;
    }

    if (endDate && nextDueDate > endDate) {
        return; // Stop creating new tasks after the end date
    }
    
    const newTask: Task = {
        ...task,
        id: `task-${Date.now()}`,
        status: "To Do",
        dueDate: nextDueDate,
        createdAt: new Date(),
        actualStartDate: undefined,
        completedAt: undefined,
        timeline: [{ id: `tl-${Date.now()}`, timestamp: new Date(), action: "Recurring task created", user: "System" }],
    };
    setTasks((prev) => [newTask, ...prev]);
  };
  
  const handleTaskAction = (taskId: string, newStatus: TaskStatus, details?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'In Progress') {
        updates.actualStartDate = new Date();
    }
    if (newStatus === 'Done') {
        updates.completedAt = new Date();
        if (task.recurrence) {
            createNextRecurringTask(task);
        }
    }

    updateTask(taskId, updates, { action: `Status changed to ${newStatus}`, details, user: "System" });
  };
  
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  }

  const handleCloseDetails = () => {
    setSelectedTask(null);
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
        'To Do': 1,
        'In Progress': 2,
        'On Hold': 3,
        'Under Review': 4,
        'Done': 5,
        'Cancelled': 6
    }

    filtered.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
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
                onTaskSelect={handleSelectTask}
              />
            </CardContent>
          </Card>
        </section>
        
        {selectedTask && (
            <TaskDetails 
                task={selectedTask} 
                onClose={handleCloseDetails}
                onAction={handleTaskAction}
            />
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Built with a focus on clarity and simplicity.
      </footer>
    </div>
  );
}
