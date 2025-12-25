
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Collection, Task } from '@/lib/types';
import { database } from '@/lib/db';
import { TaskList } from '@/components/work-item/TaskList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CollectionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const collectionId = params.collectionId as string;

    const [collection, setCollection] = useState<Collection | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (collectionId) {
            const foundCollection = database.getCollection(collectionId);
            setCollection(foundCollection || null);

            if (foundCollection) {
                const allTasks = database.getTasks();
                const collectionTasks = allTasks.filter(task => task.parentId === collectionId);
                setTasks(collectionTasks);
            }
        }
    }, [collectionId]);

    const handleSelectTask = (task: Task) => {
        router.push(`/tasks/${task.id}`);
    }

    if (!collection) {
        return <div>Loading Collection...</div>;
    }

    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
            <header className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{collection.title}</h1>
                <p className="text-muted-foreground mt-1">{collection.description}</p>
            </header>

            <section>
              <Card>
                <CardHeader>
                    <CardTitle>Work Items in this Collection</CardTitle>
                    <CardDescription>A list of all work items that are part of the "{collection.title}" collection.</CardDescription>
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
