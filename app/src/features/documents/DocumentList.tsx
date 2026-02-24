import { FileText, Printer, Trash2, Eye } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'] & { signedUrl?: string };

interface DocumentListProps {
    documents: Document[];
    onDelete: (id: string, url: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No documents found for this client.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
                <GlassCard key={doc.id} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                            <p className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2 max-w-[150px] sm:max-w-[200px]">
                                {doc.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                {new Date(doc.uploaded_at).toLocaleDateString()} • {(doc.size ? doc.size / 1024 : 0).toFixed(0)} KB
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/20 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
                            title="View"
                        >
                            <Eye className="w-4 h-4" />
                        </a>
                        <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/20 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
                            title="Print (Browser Native)"
                            onClick={(e) => {
                                // For PDF, opening in new tab triggers browser PDF viewer which has print
                                // If image, we might need a print helper, but browser native is usually best.
                            }}
                        >
                            <Printer className="w-4 h-4" />
                        </a>
                        <button
                            onClick={() => onDelete(doc.id, doc.url)}
                            className="p-2 hover:bg-red-500/10 rounded-full text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}
