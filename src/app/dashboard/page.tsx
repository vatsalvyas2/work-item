'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/db';
import { Task } from '@/lib/types';
import { TaskDashboard } from '@/components/work-item/TaskDashboard';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(database.getTasks());
  }, []);

  return <TaskDashboard tasks={tasks} />;
}
