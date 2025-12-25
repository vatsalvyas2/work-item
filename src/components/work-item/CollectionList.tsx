
'use client';

import { Collection } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CollectionListProps {
  collections: Collection[];
}

export function CollectionList({ collections }: CollectionListProps) {
  const router = useRouter();

  if (collections.length === 0) {
    return null;
  }

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collections.map((collection) => (
            <div 
              key={collection.id} 
              onClick={() => handleCollectionClick(collection.id)}
              className={cn(
                "flex items-center justify-between p-3 bg-secondary/50 rounded-lg",
                "cursor-pointer hover:bg-secondary/80 transition-colors"
              )}
            >
                <div className="flex items-center gap-3">
                    <Book className="h-5 w-5 text-purple-600" />
                    <div>
                        <h3 className="font-semibold">{collection.title}</h3>
                        <p className="text-sm text-muted-foreground">{collection.description}</p>
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
