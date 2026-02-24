'use client';

import dynamic from 'next/dynamic';

const GlobalSearchDialog = dynamic(
    () => import('./GlobalSearchDialog').then((mod) => mod.GlobalSearchDialog),
    { ssr: false }
);

export function GlobalSearchWrapper() {
    return <GlobalSearchDialog />;
}
