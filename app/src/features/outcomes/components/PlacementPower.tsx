import { DollarSign, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlacementPowerProps {
    totalPlacements: number;
    avgWage: number;
}

export function PlacementPower({ totalPlacements, avgWage }: PlacementPowerProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPlacements}</div>
                    <p className="text-xs text-muted-foreground">
                        Career outcomes secured
                    </p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Starting Wage</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${avgWage.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Hourly rate at placement
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
