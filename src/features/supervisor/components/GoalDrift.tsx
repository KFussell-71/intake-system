
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertCircle } from 'lucide-react';

interface Metric {
    client_name: string;
    goal_description: string;
    target_date: string;
    days_overdue: number;
}

export function GoalDrift({ goals }: { goals: Metric[] }) {
    if (!goals?.length) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goal Drift (Top 10)</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {goals.map((goal, i) => (
                    <div key={i} className="flex flex-col space-y-1 border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-medium truncate max-w-[150px]">{goal.client_name}</span>
                            <span className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {goal.days_overdue} days late
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{goal.goal_description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
