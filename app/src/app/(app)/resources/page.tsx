
import { ResourceFinder } from '@/features/resources/ResourceFinder';
import { ActionButton } from '@/components/ui/ActionButton';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Beginning Intake</h1>
                    <Link href="/dashboard">
                        <ActionButton variant="ghost" icon={<Home className="w-4 h-4" />}>
                            Dashboard
                        </ActionButton>
                    </Link>
                </div>
            </header>
            <main className="py-8">
                <ResourceFinder />
            </main>
        </div>
    );
}
