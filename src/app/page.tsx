
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Task, FilterStatus, FilterPriority, TaskStatus, Collection, Notification } from "@/lib/types";
import { TaskForm } from "@/components/work-item/TaskForm";
import { FilterControls } from "@/components/work-item/FilterControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useUser();


  useEffect(() => {
    setTasks(database.getTasks());
    setCollections(database.getCollections());
    setNotifications(database.getNotifications().filter(n => !n.recipient || n.recipient === currentUser.name));
  }, [currentUser]);

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
              recipient: task.assignee
            });
            hasNewNotifications = true;
        }
      }
    });

    if (hasNewNotifications) {
        setNotifications(database.getNotifications().filter(n => !n.recipient || n.recipient === currentUser.name));
    }
  }, [tasks, notifications, currentUser.name]);

  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");
  const [hideCollections, setHideCollections] = useState(false);

  const addCollection = (collection: Omit<Collection, "id" | "project">) => {
    const newCollection: Collection = {
      ...collection,
      id: `collection-${Date.now()}`,
      project: "SCRUM-X" // Placeholder
    };
    const updatedCollections = database.addCollection(newCollection);
    setCollections([...updatedCollections]);
  };

  const addTask = (task: Omit<Task, "id" | "status" | "createdAt" | "timeline" | "subtasks" | "comments" >) => {
    const newTasks = database.addTask(task);
    setTasks([...newTasks]);
  };
  
  const handleSelectTask = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  }

  const handleNotificationClick = (notification: Notification) => {
      if(notification.taskId) {
        router.push(`/tasks/${notification.taskId}`);
      }
      const updatedNotifications = database.markNotificationsAsRead([notification.id]);
      setNotifications(updatedNotifications.filter(n => !n.recipient || n.recipient === currentUser.name));
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    const updatedNotifications = database.markNotificationsAsRead(unreadIds);
    setNotifications(updatedNotifications.filter(n => !n.recipient || n.recipient === currentUser.name));
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
  
  const tasksByCollection = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    const standalone: Task[] = [];

    filteredAndSortedTasks.forEach(task => {
        if (task.parentId) {
            if (!grouped[task.parentId]) {
                grouped[task.parentId] = [];
            }
            grouped[task.parentId].push(task);
        } else {
            standalone.push(task);
        }
    });

    return { grouped, standalone };
  }, [filteredAndSortedTasks]);

  const collectionOrder = useMemo(() => {
      return [...collections].sort((a, b) => a.title.localeCompare(b.title));
  }, [collections]);


  return (
    <div className="space-y-8">
        {(currentUser.role === 'reporter' || currentUser.role === 'assignee') && (
          <section>
            <TaskForm 
              onTaskSubmit={addTask} 
              collections={collections}
              tasks={tasks}
            />
          </section>
        )}

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
                hideCollections={hideCollections}
                setHideCollections={setHideCollections}
                />
            </CardHeader>
            <CardContent>
                {hideCollections ? (
                     <ul className="space-y-1 list-disc list-inside">
                        {filteredAndSortedTasks.map(task => (
                            <li key={task.id} 
                                onClick={() => handleSelectTask(task)}
                                className={cn(
                                    "cursor-pointer hover:underline",
                                    task.status === 'Done' && 'line-through text-muted-foreground'
                                )}
                            >
                                {task.title}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="space-y-2">
                        {collectionOrder.map(collection => {
                            const collectionTasks = tasksByCollection.grouped[collection.id] || [];
                            if (collectionTasks.length === 0) return null;

                            return (
                                <li key={collection.id} className="list-disc list-inside font-semibold">
                                    {collection.title}
                                    <ul className="pl-6 mt-1 space-y-1 font-normal">
                                        {collectionTasks.map(task => (
                                            <li key={task.id} 
                                                onClick={() => handleSelectTask(task)}
                                                className={cn(
                                                    "cursor-pointer hover:underline list-['-_'] pl-2",
                                                    task.status === 'Done' && 'line-through text-muted-foreground'
                                                )}
                                            >
                                                {task.title}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )
                        })}
                        {tasksByCollection.standalone.map(task => (
                            <li key={task.id} 
                                onClick={() => handleSelectTask(task)}
                                className={cn(
                                    "cursor-pointer hover:underline list-outside list-[circle] ml-5",
                                    task.status === 'Done' && 'line-through text-muted-foreground'
                                )}
                            >
                                {task.title}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
            </Card>
        </section>
    </div>
  );
}
