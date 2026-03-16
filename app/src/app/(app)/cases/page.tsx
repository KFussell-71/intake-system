import { CaseList } from '@/features/case-management/components/CaseList';
import { Plus } from 'lucide-react';

export default function CasesPage() {
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">Case Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage active cases and track client progress
                    </p>
                </div>
                {/* Future: Manual Case Creation Button */}
            </div>

            <CaseList />
        </div>
    );
}
