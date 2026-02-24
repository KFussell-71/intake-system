
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CaseloadDistribution({ data }: { data: Array<{ staff_email: string, active_cases: number }> }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff Caseloads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {data.map((staff, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[120px]" title={staff.staff_email}>{staff.staff_email || 'Unknown Staff'}</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-24 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${Math.min(staff.active_cases * 5, 100)}%` }} // Rough scale: 20 cases = 100%
                                />
                            </div>
                            <span className="font-mono w-4 text-right">{staff.active_cases}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

