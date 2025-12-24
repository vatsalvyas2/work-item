
import type { AppDatabase, Task, Epic } from './types';

// In-memory database
let db: AppDatabase = {
    tasks: [
        {
          id: "task-1",
          title: "Set up the project structure",
          taskType: "Task",
          description: "Define the folder structure and install base dependencies.",
          priority: "high",
          status: "Done",
          dueDate: new Date("2024-08-01T17:00:00"),
          createdAt: new Date("2024-07-25"),
          completedAt: new Date("2024-07-28"),
          reviewRequired: false,
          isCritical: true,
          timeline: [{id: "t1-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [],
          requester: "Vatsal Vyas",
          reporter: "Vatsal Vyas"
        },
        {
          id: "task-2",
          title: "Create the main UI components",
          taskType: "Story",
          description: "Develop React components for the main layout, header, and footer.",
          priority: "high",
          status: "In Progress",
          dueDate: new Date("2024-08-05T09:00:00"),
          createdAt: new Date("2024-07-26"),
          plannedStartDate: new Date("2024-07-28"),
          actualStartDate: new Date("2024-07-29"),
          duration: 40,
          reviewRequired: true,
          isCritical: false,
          assignee: "Alex",
          reviewer: "Bob",
          timeline: [{id: "t2-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [{id: "c2-1", timestamp: new Date(), text: "Can I get more info?", user: "Alex"}],
          requester: "Vatsal Vyas",
          reporter: "Vatsal Vyas",
          parentId: "epic-1",
        },
        {
          id: "task-3",
          title: "Implement task state management",
          taskType: "Task",
          description: "Use React hooks like useState and useReducer for state.",
          priority: "medium",
          status: "To Do",
          dueDate: new Date("2024-08-10T14:00:00"),
          createdAt: new Date("2024-07-27"),
          reviewRequired: false,
          isCritical: false,
          timeline: [{id: "t3-1", timestamp: new Date(), action: "Task Created", user: "Admin"}],
          subtasks: [],
          comments: [],
          requester: "Jane Doe",
          reporter: "Jane Doe",
          parentId: "epic-1",
        },
      ],
    epics: [
        { id: 'epic-1', title: 'User Management Feature', project: 'SCRUM-5', description: 'Epic for user management' }
    ]
};

// This is a simple in-memory database. In a real app, you'd use a proper database.
export const database = {
  getTasks: () => db.tasks,
  getTask: (id: string) => db.tasks.find(t => t.id === id),
  addTask: (task: Task) => {
    db.tasks.unshift(task);
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
  getEpics: () => db.epics,
  getEpic: (id: string) => db.epics.find(e => e.id === id),
  addEpic: (epic: Epic) => {
    db.epics.unshift(epic);
    return db.epics;
  },
};

    
