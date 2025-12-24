
'use client';

import { Epic } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EpicListProps {
  epics: Epic[];
}

export function EpicList({ epics }: EpicListProps) {
  const router = useRouter();

  if (epics.length === 0) {
    return null;
  }

  const handleEpicClick = (epicId: string) => {
    router.push(`/epics/${epicId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Epics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {epics.map((epic) => (
            <div 
              key={epic.id} 
              onClick={() => handleEpicClick(epic.id)}
              className={cn(
                "flex items-center justify-between p-3 bg-secondary/50 rounded-lg",
                "cursor-pointer hover:bg-secondary/80 transition-colors"
              )}
            >
                <div className="flex items-center gap-3">
                    <Book className="h-5 w-5 text-purple-600" />
                    <div>
                        <h3 className="font-semibold">{epic.title}</h3>
                        <p className="text-sm text-muted-foreground">{epic.description}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
