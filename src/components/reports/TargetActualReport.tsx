
'use client';

import { useMemo, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TargetActualReportProps {
  allTasks: Task[];
}

export function TargetActualReport({ allTasks }: TargetActualReportProps) {
  const [dateRange] = useState(() => {
    const end = endOfMonth(new Date());
    const start = startOfMonth(subMonths(end, 1));
    return { start, end };
  });

  const burndownData = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    const tasksInPeriod = allTasks.filter(task => {
        const createDate = task.createdAt;
        return createDate >= dateRange.start && createDate <= dateRange.end;
    });

    const totalStoryPoints = tasksInPeriod.reduce((acc, task) => acc + (task.storyPoints || 0), 0);
    
    let remainingPoints = totalStoryPoints;
    const idealPointsPerDay = totalStoryPoints / days.length;

    return days.map((day, index) => {
        const completedOnDay = allTasks.filter(task => 
            task.completedAt && format(task.completedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        );

        const pointsCompleted = completedOnDay.reduce((acc, task) => acc + (task.storyPoints || 0), 0);
        remainingPoints -= pointsCompleted;

        return {
            date: format(day, 'MMM d'),
            'Ideal': Math.max(0, totalStoryPoints - (index + 1) * idealPointsPerDay),
            'Actual': remainingPoints,
        };
    });
  }, [allTasks, dateRange]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Target vs. Actual (Burn-down)</CardTitle>
        <CardDescription>
            Burn-down chart of story points for tasks created in the last month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {burndownData.length > 1 && (burndownData[0].Ideal > 0) ? (
             <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                    data={burndownData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Ideal" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} strokeWidth={2} />
                    <Area type="monotone" dataKey="Actual" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">
                    Not enough data to display burn-down chart. <br/>
                    Make sure tasks have story points assigned.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
