



export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'On Hold'
  | 'Under Review'
  | 'Done'
  | 'Cancelled'
  | 'Blocked';

export type TaskType = 'Story' | 'Task' | 'Bug';
export type TaskPriority = 'low' | 'medium' | 'high' | 'none';

export type TimelineEntry = {
  id: string;
  timestamp: Date;
  action: string;
  details?: string;
  user: string; 
};

export type Comment = {
  id: string;
  timestamp: Date;
  text: string;
  user: string;
}

export type Recurrence = {
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: Date;
}

export type Epic = {
  id: string;
  title: string;
  project: string;
  description: string;
}

export type Subtask = {
    id: string;
    title: string;
    status: 'To Do' | 'Done';
}

export type ExtensionRequest = {
  requestedAt: Date;
  newDueDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type Task = {
  id: string;
  title: string;
  taskType: TaskType;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | undefined;
  createdAt: Date;
  plannedStartDate?: Date;
  actualStartDate?: Date;
  completedAt?: Date;
  duration?: number; // in hours
  isCritical: boolean;
  reviewRequired: boolean;
  requester?: string;
  assignee?: string; 
  reporter?: string;
  reviewer?: string; 
  timeline: TimelineEntry[];
  comments: Comment[];
  recurrence?: Recurrence;
  parentId?: string; // Link to Epic
  subtasks: Subtask[];
  labels?: string[];
  dependsOn?: string[]; // NEW: IDs of tasks that must be completed first
  storyPoints?: number;
  sprint?: string;
  extensionRequest?: ExtensionRequest;
};

export type FilterStatus = TaskStatus | 'all';
export type FilterPriority = TaskPriority | 'all';

// Database type
export type AppDatabase = {
  tasks: Task[];
  epics: Epic[];
};
