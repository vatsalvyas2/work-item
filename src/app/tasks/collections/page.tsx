
'use client';

import { useState, useEffect } from 'react';
import { CollectionList } from '@/components/work-item/CollectionList';
import { database } from '@/lib/db';
import { Collection } from '@/lib/types';

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        setCollections(database.getCollections());
    }, []);

    return (
        <div>
            <CollectionList collections={collections} />
        </div>
    )
}
