
'use client';

import { useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { Search, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { findResourcesAction } from '@/app/actions/resources/findResources';
import { toast } from 'sonner';

export function ResourceFinder() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const response = await findResourcesAction(query);
            if (response.success) {
                setResults(response.data);
            } else {
                toast.error('Failed to find resources');
            }
        } catch (e) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Community Resource Finder
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Tell us what your client needs (e.g., "Food for tonight", "Emergency shelter", "Job training") and AI will match you with verified Antelope Valley services.
                </p>
            </div>

            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Describe the need..."
                    className="w-full px-6 py-4 rounded-full border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-lg shadow-sm bg-white dark:bg-slate-800 transition-all"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white rounded-full px-6 flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                    {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Find Resources
                </button>
            </div>

            {/* Results Display */}
            {results && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">AI Analysis</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{results.reasoning}</p>
                            </div>
                        </div>
                    </div>

                    {results.source === 'local' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {results.matches.map((resource: any) => (
                                <div key={resource.id} className="bg-white dark:bg-slate-800 border rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded mb-2">
                                                {resource.category}
                                            </span>
                                            <h3 className="font-bold text-lg">{resource.name}</h3>
                                        </div>
                                        {resource.is_verified && (
                                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm line-clamp-2">{resource.description}</p>

                                    <div className="mt-4 space-y-2 text-sm">
                                        {resource.address && (
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MapPin className="w-4 h-4" />
                                                <span>{resource.address}</span>
                                            </div>
                                        )}
                                        {resource.website && (
                                            <a href={resource.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                                <ExternalLink className="w-4 h-4" />
                                                Visit Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No local matches found.</h3>
                            <p className="text-slate-500">The AI suggests searching the web for this specific need.</p>
                            {/* In a real "Discovery Mode", we would execute the search here or show a button */}
                            <div className="mt-6">
                                <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(results.reasoning.split('"')[1] || query + ' Antelope Valley')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    <Search className="w-4 h-4" />
                                    Search Google for Resources
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
