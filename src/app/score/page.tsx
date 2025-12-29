
'use client';

import { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/db';
import { useUser } from '@/contexts/UserContext';
import { Task, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Award, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

interface UserScore {
  user: User;
  totalScore: number;
  completedTasks: number;
}

export default function ScoreboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { users } = useUser();
  const router = useRouter();

  useEffect(() => {
    setTasks(database.getTasks());
  }, []);

  const userScores = useMemo<UserScore[]>(() => {
    const scores = users.map(user => {
      const assignedTasks = tasks.filter(task => task.assignee === user.name && task.status === 'Done');
      const totalScore = assignedTasks.reduce((acc, task) => acc + (task.score ?? 0), 0);
      return {
        user,
        totalScore,
        completedTasks: assignedTasks.length,
      };
    });
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }, [tasks, users]);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const selectedUserTasks = useMemo(() => {
    if (!selectedUser) return [];
    return tasks
      .filter(task => task.assignee === selectedUser.name && task.status === 'Done')
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  }, [tasks, selectedUser]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Overall scores of all users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userScores.map((score, index) => (
                <div 
                  key={score.user.name} 
                  className={cn(
                      "flex items-center p-3 rounded-lg cursor-pointer",
                      selectedUser?.name === score.user.name ? "bg-primary/10" : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedUser(score.user)}
                >
                  <span className="text-lg font-bold w-8">{index + 1}</span>
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback>{score.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold">{score.user.name}</p>
                    <p className="text-sm text-muted-foreground">{score.completedTasks} tasks completed</p>
                  </div>
                  <div className={cn("text-xl font-bold flex items-center gap-1", score.totalScore < -100 * score.completedTasks ? 'text-red-500' : 'text-green-600')}>
                     {score.totalScore}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{selectedUser ? `${selectedUser.name}'s Completed Tasks` : 'Select a User'}</CardTitle>
            <CardDescription>{selectedUser ? 'Detailed breakdown of completed tasks and scores.' : 'Click on a user from the leaderboard to see their tasks.'}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedUserTasks.map(task => (
                        <React.Fragment key={task.id}>
                            <TableRow className="cursor-pointer" onClick={() => router.push(`/tasks/${task.id}`)}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell className={cn("text-right font-bold", (task.score ?? 0) < -100 ? 'text-red-500' : 'text-green-600')}>
                                    {task.score ?? 'N/A'}
                                </TableCell>
                            </TableRow>
                             {task.scoreBreakdown && (
                                <TableRow>
                                    <TableCell colSpan={2} className="p-2 bg-muted/50">
                                       <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="flex items-center justify-center gap-1 text-yellow-600">
                                                <Clock className="h-3 w-3" />
                                                <span>Ext: {-task.scoreBreakdown.extensionPenalty}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1 text-orange-600">
                                                <AlertCircle className="h-3 w-3" />
                                                <span>Delay: {-task.scoreBreakdown.delayPenalty}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1 text-red-600">
                                                <RefreshCw className="h-3 w-3" />
                                                <span>Rework: {-task.scoreBreakdown.reworkPenalty}</span>
                                            </div>
                                       </div>
                                    </TableCell>
                                </TableRow>
                             )}
                             <TableRow><TableCell colSpan={2} className="p-0"><Separator/></TableCell></TableRow>
                        </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No user selected.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
