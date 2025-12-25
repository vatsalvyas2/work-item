
'use client';

import { useState, useEffect } from 'react';
import { EpicList } from '@/components/work-item/EpicList';
import { database } from '@/lib/db';
import { Epic } from '@/lib/types';

export default function EpicsPage() {
    const [epics, setEpics] = useState<Epic[]>([]);

    useEffect(() => {
        setEpics(database.getEpics());
    }, []);

    return (
        <div>
            <EpicList epics={epics} />
        </div>
    )
}
