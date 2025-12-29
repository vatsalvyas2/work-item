

import type { AppDatabase, Task, Collection, Notification } from './types';

// In-memory database
let db: AppDatabase = {
    tasks: [
        {
          id: "task-1",
          title: "Set up the project structure",
          status: "Done",
          description: "Define the folder structure and install base dependencies.",
          priority: "high",
          dueDate: new Date("2024-08-01T17:00:00"),
          createdAt: new Date("2024-07-25"),
          completedAt: new Date("2024-07-28"),
          reviewRequired: false,
          timeline: [{id: "t1-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [],
          requester: "Vatsal Vyas",
          reporter: "Vatsal Vyas",
          storyPoints: 5,
        },
        {
          id: "task-2",
          title: "Create the main UI components",
          status: "Done",
          description: "Develop React components for the main layout, header, and footer.",
          priority: "high",
          dependsOn: ["task-1"],
          dueDate: new Date("2024-08-05T09:00:00"),
          createdAt: new Date("2024-07-26"),
          completedAt: new Date("2024-08-02"),
          actualStartDate: new Date("2024-07-28"),
          reviewRequired: true,
          assignee: "Alex",
          reviewer: "Bob",
          timeline: [{id: "t2-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [{id: "c2-1", timestamp: new Date(), text: "Can I get more info?", user: "Alex"}],
          requester: "Vatsal Vyas",
          reporter: "Vatsal Vyas",
          parentId: "collection-1",
          storyPoints: 8,
        },
        {
          id: "task-3",
          title: "Implement task state management",
          status: "In Progress",
          description: "Use React hooks like useState and useReducer for state.",
          priority: "medium",
          dependsOn: ["task-2"],
          dueDate: new Date("2024-08-10T14:00:00"),
          createdAt: new Date("2024-07-27"),
          reviewRequired: false,
          timeline: [{id: "t3-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [],
          requester: "Jane Doe",
          reporter: "Jane Doe",
          parentId: "collection-1",
          storyPoints: 3,
        },
      ],
    collections: [
        { id: 'collection-1', title: 'User Management Feature', project: 'SCRUM-5', description: 'Collection for user management' }
    ],
    notifications: [],
};

// This is a simple in-memory database. In a real app, you'd use a proper database.
export const database = {
  getTasks: () => db.tasks,
  getTask: (id: string) => db.tasks.find(t => t.id === id),
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'timeline' | 'subtasks' | 'comments'>) => {
     const isBlocked = task.dependsOn && task.dependsOn.length > 0 && task.dependsOn.some(depId => {
        const dependency = database.getTask(depId);
        return dependency && dependency.status !== 'Done';
    });

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      status: isBlocked ? 'Blocked' : 'To Do',
      createdAt: new Date(),
      timeline: [{ id: `tl-${Date.now()}`, timestamp: new Date(), action: "Work Item Created", user: task.reporter || 'System' }],
      subtasks: [],
      comments: [],
    };
    db.tasks.unshift(newTask);
    return db.tasks;
  },
  updateTask: (id: string, updatedTaskData: Partial<Task>) => {
    let taskToUpdate: Task | undefined;
    db.tasks = db.tasks.map(t => {
      if (t.id === id) {
        taskToUpdate = {...t, ...updatedTaskData};
        return taskToUpdate;
      }
      return t;
    });
    return taskToUpdate;
  },
  getCollections: () => db.collections,
  getCollection: (id: string) => db.collections.find(e => e.id === id),
  addCollection: (collection: Collection) => {
    db.collections.unshift(collection);
    return db.collections;
  },
  getNotifications: () => db.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
      isRead: false,
    };
    // Avoid adding duplicate notifications for the same overdue task
    if (notification.taskId && notification.message.includes('is overdue')) {
        const existing = db.notifications.find(n => n.taskId === notification.taskId && n.message.includes('is overdue'));
        if (existing) return db.notifications;
    }
    db.notifications.unshift(newNotification);
    return db.notifications;
  },
  markNotificationsAsRead: (ids: string[]) => {
    db.notifications = db.notifications.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n);
    return db.notifications;
  },
};
