
'use client';

import { useState, useMemo } from 'react';
import { database } from '@/lib/db';
import { Task } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyReport } from '@/components/reports/DailyReport';
import { WeeklyReport } from '@/components/reports/WeeklyReport';
import { TargetActualReport } from '@/components/reports/TargetActualReport';

export default function ReportsPage() {
  const [tasks] = useState<Task[]>(() => database.getTasks());
  
  const allTasks = useMemo(() => tasks, [tasks]);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Reports & Dashboards</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your team's productivity and track progress.
        </p>
      </header>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-6">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="target-vs-actual">Target vs. Actual</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <DailyReport allTasks={allTasks} />
        </TabsContent>
        <TabsContent value="weekly">
          <WeeklyReport allTasks={allTasks} />
        </TabsContent>
        <TabsContent value="target-vs-actual">
          <TargetActualReport allTasks={allTasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
