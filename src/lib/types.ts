export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'all' | 'incomplete' | 'completed';

export type Task = {
  id: string;
  description: string;
  dueDate: Date | undefined;
  priority: TaskPriority;
  completed: boolean;
};
