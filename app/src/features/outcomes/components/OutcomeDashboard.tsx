import { OutcomeService } from '@/services/OutcomeService';
import { PlacementPower } from './PlacementPower';
import { RetentionRing } from './RetentionRing';
import { WageGrowthChart } from './WageGrowthChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export async function OutcomeDashboard() {
    let metrics = null;
    let error = null;

    try {
        metrics = await OutcomeService.getMetrics();
    } catch (err: any) {
        console.error("Outcome Dashboard Error:", err);
        error = err.message || "Failed to load outcome metrics";
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Error Loading Outcomes</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!metrics) return <div>Loading Impact Data...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Economic Impact Engine</h2>
                <p className="text-muted-foreground">Real-time justification of program value and ROI.</p>
            </div>

            {/* Top Row: The "Money" Cards */}
            <PlacementPower totalPlacements={metrics.total_placements} avgWage={metrics.avg_wage} />

            {/* Chart Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <RetentionRing rates={metrics.retention_rates} />
                <WageGrowthChart avgWage={metrics.avg_wage} wageGrowth={metrics.wage_growth} />
            </div>
        </div>
    );
}
