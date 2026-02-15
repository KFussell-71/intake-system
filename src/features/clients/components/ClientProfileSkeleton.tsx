
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ClientProfileSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Face Sheet Skeleton */}
            <Card className="p-6 border-l-4 border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
            </Card>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-12 w-full rounded-xl" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Mimic Timeline */}
                        <Card className="p-6 space-y-4">
                            <Skeleton className="h-6 w-1/3" />
                            <div className="space-y-4 pt-4">
                                <div className="flex gap-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        {/* Mimic Vitals */}
                        <Card className="p-4 space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
