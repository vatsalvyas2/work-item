
'use client';

import { useState, useEffect } from 'react';
import { CollectionList } from '@/components/work-item/CollectionList';
import { database } from '@/lib/db';
import { Collection } from '@/lib/types';
import { CollectionForm } from '@/components/work-item/CollectionForm';

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);

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
    };

    return (
        <div className="space-y-8">
            <section>
                <CollectionForm onCollectionSubmit={addCollection} />
            </section>
            <section>
                <CollectionList collections={collections} />
            </section>
        </div>
    )
}
