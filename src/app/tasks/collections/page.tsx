
'use client';

import { useState, useEffect } from 'react';
import { CollectionList } from '@/components/work-item/CollectionList';
import { database } from '@/lib/db';
import { Collection } from '@/lib/types';
import { CollectionForm } from '@/components/work-item/CollectionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        setCollections(database.getCollections());
    }, []);

    const addCollection = (collection: Omit<Collection, "id" | "project">) => {
        const newCollection: Collection = {
          ...collection,
          id: `collection-${Date.now()}`,
          project: "SCRUM-X" // Placeholder
        };
        const updatedCollections = database.addCollection(newCollection);
        setCollections([...updatedCollections]);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-8">
            <section>
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <CardTitle>Collections</CardTitle>
                            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Collection
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create Collection</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <CollectionForm onCollectionSubmit={addCollection} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CollectionList collections={collections} />
                    </CardContent>
                 </Card>
            </section>
        </div>
    )
}
