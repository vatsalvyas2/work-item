
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/lib/types';
import { database } from '@/lib/db';
import { TaskCalendar } from '@/components/work-item/TaskCalendar';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  useEffect(() => {
    setTasks(database.getTasks());
  }, []);

  const handleSelectTask = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  return <TaskCalendar tasks={tasks} onTaskSelect={handleSelectTask} />;
}
