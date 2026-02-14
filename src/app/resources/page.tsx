
import { ResourceFinder } from '@/features/resources/ResourceFinder';
import { Header } from '@/components/layout/Header';

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <main className="py-8">
                <ResourceFinder />
            </main>
        </div>
    );
}
