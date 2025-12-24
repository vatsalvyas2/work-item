export type TaskStatus =
  | 'To Do'
  | 'In Progress'
  | 'On Hold'
  | 'Under Review'
  | 'Done'
  | 'Cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TimelineEntry = {
  id: string;
  timestamp: Date;
  action: string;
  details?: string;
  user: string; // For now, just a name. Later could be a user ID.
};

export type Task = {
  id: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | undefined;
  createdAt: Date;
  actualStartDate?: Date;
  completedAt?: Date;
  reviewRequired: boolean;
  assignee?: string; // For now, just a name
  reviewer?: string; // For now, just a name
  timeline: TimelineEntry[];
};

export type FilterStatus = TaskStatus | 'all';
export type FilterPriority = TaskPriority | 'all';
