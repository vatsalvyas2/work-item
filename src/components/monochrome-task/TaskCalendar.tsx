
"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, getMonth, getYear, add, isWithinInterval } from "date-fns";
import { Task } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

export function TaskCalendar({ tasks, onTaskSelect }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const tasksByDate = days.reduce((acc, day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    acc[dateKey] = tasks.filter(task => {
        if (!task.dueDate) return false;

        // One-time tasks
        if (!task.recurrence) {
            return isSameDay(task.dueDate, day);
        }

        // Recurring tasks
        const { interval, endDate: recurrenceEndDate } = task.recurrence;
        
        // Check if the current day is within the recurrence period
        if (day < task.dueDate || (recurrenceEndDate && day > recurrenceEndDate)) {
            return false;
        }

        switch (interval) {
            case 'daily':
                return true;
            case 'weekly':
                return task.dueDate.getDay() === day.getDay();
            case 'monthly':
                return task.dueDate.getDate() === day.getDate();
            case 'yearly':
                return task.dueDate.getMonth() === day.getMonth() && task.dueDate.getDate() === day.getDate();
            default:
                return false;
        }
    });
    return acc;
  }, {} as Record<string, Task[]>);

  const getTaskColor = (status: Task['status'], dueDate: Date | undefined) => {
    if (status === 'Done') return 'bg-green-200 text-green-800';
    if (status === 'Cancelled') return 'bg-gray-200 text-gray-600';
    if (dueDate && new Date(dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && status !== 'Done') return 'bg-red-200 text-red-800';
    if (status === 'In Progress') return 'bg-yellow-200 text-yellow-800';
    if (status === 'Under Review') return 'bg-purple-200 text-purple-800';
    if (status === 'On Hold') return 'bg-gray-300 text-gray-800';
    return 'bg-blue-100 text-blue-700';
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border-t border-l border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="py-2 text-center font-semibold text-sm bg-gray-50 text-gray-600">{day}</div>
        ))}
        {days.map(day => (
          <div
            key={day.toString()}
            className={cn(
              "relative bg-white p-2 min-h-[120px]",
              !isSameMonth(day, monthStart) && "bg-gray-50 opacity-50",
              isSameDay(day, new Date()) && "bg-blue-50"
            )}
          >
            <span className="font-semibold text-sm">{format(day, "d")}</span>
            <div className="mt-1 space-y-1">
              {tasksByDate[format(day, "yyyy-MM-dd")]?.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskSelect(task)}
                  className={cn(
                    "p-1 rounded-md text-xs cursor-pointer hover:opacity-80 truncate",
                    getTaskColor(task.status, task.dueDate)
                  )}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
