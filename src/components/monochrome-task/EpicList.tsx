
import { Epic } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ChevronRight } from "lucide-react";

interface EpicListProps {
  epics: Epic[];
}

export function EpicList({ epics }: EpicListProps) {
  if (epics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Epics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {epics.map((epic) => (
            <div key={epic.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
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
