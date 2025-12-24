
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Task, FilterStatus, FilterPriority, TaskStatus, Subtask, Epic } from "@/lib/types";
import { TaskForm } from "@/components/monochrome-task/TaskForm";
import { TaskList } from "@/components/monochrome-task/TaskList";
import { FilterControls } from "@/components/monochrome-task/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDashboard } from "@/components/monochrome-task/TaskDashboard";
import { TaskCalendar } from "@/components/monochrome-task/TaskCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, List, Calendar } from "lucide-react";
import { database } from "@/lib/db";
import { EpicList } from "@/components/monochrome-task/EpicList";


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);

  useEffect(() => {
    setTasks(database.getTasks());
    setEpics(database.getEpics());
  }, []);

  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  const addEpic = (epic: Omit<Epic, "id" | "project">) => {
    const newEpic: Epic = {
      ...epic,
      id: `epic-${Date.now()}`,
      project: "SCRUM-X" // Placeholder
    };
    const updatedEpics = database.addEpic(newEpic);
    setEpics([...updatedEpics]);
  };

  const addTask = (task: Omit<Task, "id" | "status" | "createdAt" | "timeline" | "subtasks" | "comments" >) => {
    
    const isBlocked = task.dependsOn && task.dependsOn.length > 0 && task.dependsOn.some(depId => {
        const dependency = database.getTask(depId);
        return dependency && dependency.status !== 'Done';
    });

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      status: isBlocked ? 'Blocked' : 'To Do',
      createdAt: new Date(),
      timeline: [{ id: `tl-${Date.now()}`, timestamp: new Date(), action: "Task Created", user: "System" }],
      subtasks: [],
      comments: [],
      requester: "Current User", // Placeholder
    };
    const updatedTasks = database.addTask(newTask);
    setTasks([...updatedTasks]);
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
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
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
    <div className="bg-background text-foreground min-h-screen font-body">
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight font-headline">
            MonochromeTask
          </h1>
          <p className="text-muted-foreground mt-2">
            A minimalist approach to task management.
          </p>
        </header>

        <section className="mb-8">
          <TaskForm 
            onTaskSubmit={addTask} 
            onEpicSubmit={addEpic} 
            epics={epics}
            tasks={tasks}
          />
        </section>

        <section className="mb-8">
            <EpicList epics={epics} />
        </section>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-6">
            <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Task List</TabsTrigger>
            <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4" />Calendar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
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
          </TabsContent>
          <TabsContent value="dashboard">
            <TaskDashboard tasks={tasks} />
          </TabsContent>
          <TabsContent value="calendar">
            <TaskCalendar tasks={tasks} onTaskSelect={handleSelectTask} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Built with a focus on clarity and simplicity.
      </footer>
    </div>
  );
}
