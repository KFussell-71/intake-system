
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, CalendarClock } from 'lucide-react';

interface Metric {
    client_name: string;
    exit_date: string;
    days_remaining: number;
}

export function UpcomingExits({ exits }: { exits: Metric[] }) {
    if (!exits?.length) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Exits (30 Days)</CardTitle>
                <LogOut className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {exits.map((exit, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{exit.client_name}</span>
                            <span className="text-xs text-muted-foreground">Exits: {new Date(exit.exit_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <CalendarClock className="w-3 h-3" />
                            {exit.days_remaining}d
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
