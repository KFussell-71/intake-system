
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ComplianceHeatmap({ data }: { data: { unsigned_intakes: number, overdue_reviews: number, missing_docs: number } }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Compliance Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                    <span className="font-medium">Unsigned Intakes</span>
                    <span className="font-bold text-amber-600">{data.unsigned_intakes}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                    <span className="font-medium">Overdue Care Plans</span>
                    <span className="font-bold text-amber-600">{data.overdue_reviews}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                    <span className="font-medium">Paperwork Debt</span>
                    <span className="font-bold text-red-600">{data.missing_docs}</span>
                </div>
            </CardContent>
        </Card>
    );
}



