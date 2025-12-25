
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Epic, Task } from '@/lib/types';
import { database } from '@/lib/db';
import { TaskList } from '@/components/work-item/TaskList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EpicDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const epicId = params.epicId as string;

    const [epic, setEpic] = useState<Epic | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (epicId) {
            const foundEpic = database.getEpic(epicId);
            setEpic(foundEpic || null);

            if (foundEpic) {
                const allTasks = database.getTasks();
                const epicTasks = allTasks.filter(task => task.parentId === epicId);
                setTasks(epicTasks);
            }
        }
    }, [epicId]);

    const handleSelectTask = (task: Task) => {
        router.push(`/tasks/${task.id}`);
    }

    if (!epic) {
        return <div>Loading Epic...</div>;
    }

    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
            <header className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{epic.title}</h1>
                <p className="text-muted-foreground mt-1">{epic.description}</p>
            </header>

            <section>
              <Card>
                <CardHeader>
                    <CardTitle>Tasks in this Epic</CardTitle>
                    <CardDescription>A list of all tasks that are part of the "{epic.title}" epic.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskList
                        tasks={tasks}
                        onTaskSelect={handleSelectTask}
                    />
                </CardContent>
              </Card>
            </section>
        </div>
    );
}
