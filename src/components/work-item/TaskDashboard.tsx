
"use client";

import { useMemo } from "react";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

interface TaskDashboardProps {
    tasks: Task[];
}

const COLORS = {
  'To Do': '#3b82f6',
  'In Progress': '#f97316',
  'On Hold': '#a855f7',
  'Under Review': '#eab308',
  'Done': '#22c55e',
  'Cancelled': '#6b7280',
  'Blocked': '#ef4444',
};

const PRIORITY_COLORS = {
    'low': '#86efac',
    'medium': '#facc15',
    'high': '#f87171',
    'none': '#d1d5db'
};


export function TaskDashboard({ tasks }: TaskDashboardProps) {

    const statusCounts = useMemo(() => {
        const counts: Record<Task['status'], number> = { 'To Do': 0, 'In Progress': 0, 'On Hold': 0, 'Under Review': 0, 'Done': 0, 'Cancelled': 0, 'Blocked': 0 };
        tasks.forEach(task => {
            counts[task.status]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value, fill: COLORS[name as keyof typeof COLORS] }));
    }, [tasks]);

    const priorityCounts = useMemo(() => {
        const counts: Record<Task['priority'], number> = { 'low': 0, 'medium': 0, 'high': 0, 'none': 0 };
        tasks.forEach(task => {
            counts[task.priority]++;
        });
        return Object.entries(counts).filter(([,value]) => value > 0).map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS]}));
    }, [tasks]);

    const upcomingDeadlines = useMemo(() => {
        const today = new Date();
        return tasks.filter(task => task.dueDate && task.dueDate > today && task.status !== 'Done' && task.status !== 'Cancelled')
            .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
            .slice(0, 5);
    }, [tasks]);

    const overdueTasks = useMemo(() => {
        const today = new Date();
        return tasks.filter(task => task.dueDate && task.dueDate < today && task.status !== 'Done' && task.status !== 'Cancelled');
    }, [tasks]);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Tasks by Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusCounts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Tasks" barSize={40} >
                                 {statusCounts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={priorityCounts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={(props) => `${props.name.charAt(0).toUpperCase() + props.name.slice(1)}: ${props.value}`}
                          >
                            {priorityCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-lg">
                    <p><strong>Total Tasks:</strong> {tasks.length}</p>
                    <p><strong>Completed:</strong> {tasks.filter(t => t.status === 'Done').length}</p>
                    <p><strong>In Progress:</strong> {tasks.filter(t => t.status === 'In Progress').length}</p>
                    <p><strong>Overdue:</strong> <span className="text-red-600 font-bold">{overdueTasks.length}</span></p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {upcomingDeadlines.map(task => (
                            <li key={task.id} className="text-sm">
                                {task.title} - <span className="font-semibold">{task.dueDate?.toLocaleDateString()}</span>
                            </li>
                        ))}
                         {upcomingDeadlines.length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
