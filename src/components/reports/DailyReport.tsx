
'use client';

import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { TaskList } from '../work-item/TaskList';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DailyReportProps {
  allTasks: Task[];
}

export function DailyReport({ allTasks }: DailyReportProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();

  const completedTasks = useMemo(() => {
    return allTasks.filter(task =>
      task.completedAt && isSameDay(task.completedAt, selectedDate)
    );
  }, [allTasks, selectedDate]);

  const handleTaskSelect = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Daily Completion Report</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => setSelectedDate(date || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <TaskList tasks={completedTasks} onTaskSelect={handleTaskSelect} />
      </CardContent>
    </Card>
  );
}
