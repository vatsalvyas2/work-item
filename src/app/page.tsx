
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Task, FilterStatus, FilterPriority, TaskStatus, Collection, Notification } from "@/lib/types";
import { TaskForm } from "@/components/work-item/TaskForm";
import { TaskList } from "@/components/work-item/TaskList";
import { FilterControls } from "@/components/work-item/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/db";
import { CollectionList } from "@/components/work-item/CollectionList";


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [epics, setEpics] = useState<Collection[]>([]);


  useEffect(() => {
    setTasks(database.getTasks());
    setCollections(database.getCollections());
    setNotifications(database.getNotifications());
    setEpics(database.getCollections());
  }, []);

  // Effect to check for overdue tasks and create notifications
  useEffect(() => {
    const now = new Date();
    let hasNewNotifications = false;

    tasks.forEach(task => {
      const isOverdue = task.dueDate && task.dueDate < now && task.status !== 'Done' && task.status !== 'Cancelled';
      if (isOverdue) {
        const existingNotification = notifications.find(n => n.taskId === task.id && n.message.includes("overdue"));
        if (!existingNotification) {
            database.addNotification({
              message: `Work Item "${task.title}" is overdue.`,
              taskId: task.id,
            });
            hasNewNotifications = true;
        }
      }
    });

    if (hasNewNotifications) {
        setNotifications(database.getNotifications());
    }
  }, [tasks, notifications]);

  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  const addCollection = (collection: Omit<Collection, "id" | "project">) => {
    const newCollection: Collection = {
      ...collection,
      id: `collection-${Date.now()}`,
      project: "SCRUM-X" // Placeholder
    };
    const updatedCollections = database.addCollection(newCollection);
    setCollections([...updatedCollections]);
    setEpics([...updatedCollections]);
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
      timeline: [{ id: `tl-${Date.now()}`, timestamp: new Date(), action: "Work Item Created", user: "System" }],
      subtasks: [],
      comments: [],
      reporter: "Current User", // Placeholder
    };
    const updatedTasks = database.addTask(newTask);
    setTasks([...updatedTasks]);
  };
  
  const handleSelectTask = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  }

  const handleNotificationClick = (notification: Notification) => {
      if(notification.taskId) {
        router.push(`/tasks/${notification.taskId}`);
      }
      const updatedNotifications = database.markNotificationsAsRead([notification.id]);
      setNotifications(updatedNotifications);
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    const updatedNotifications = database.markNotificationsAsRead(unreadIds);
    setNotifications(updatedNotifications);
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
    <div className="space-y-8">
        <section>
          <TaskForm 
            onTaskSubmit={addTask} 
            collections={collections}
            tasks={tasks}
          />
        </section>

        <section>
            <CollectionList collections={collections} />
        </section>

        <section>
            <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Your Work Items</CardTitle>
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
