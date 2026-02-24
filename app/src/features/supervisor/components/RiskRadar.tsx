
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';

type StalledClient = {
    client_name: string;
    case_id: string;
    days_since_contact: number;
    last_contact_date: string;
    assigned_to: string; // Email
};

export function RiskRadar({ clients }: { clients: StalledClient[] }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Ghost Clients (14+ Days Silent)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {clients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No ghost clients detected.</p>
                            <p className="text-xs">All cases have recent activity.</p>
                        </div>
                    ) : (
                        clients.map((client, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-red-200 text-red-800 text-xs">
                                            {client.client_name?.substring(0, 2).toUpperCase() || '??'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{client.client_name || 'Unknown Client'}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={client.assigned_to || ''}>
                                            {client.assigned_to || 'Unassigned'}
                                        </p>
                                    </div>

                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end text-red-600 font-bold text-sm gap-1">
                                        <Clock className="w-3 h-3" />
                                        {client.days_since_contact}d
                                    </div>
                                    <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                                        <Link href={`/cases/${client.case_id}`}>View</Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
