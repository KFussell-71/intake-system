export interface IntakeTrend {
    date: string;
    count: number;
}

export interface StaffWorkload {
    staff_name: string;
    active_clients: number;
    intakes_in_progress: number;
}

export interface MyWorkload {
    active_clients: number;
    intakes_in_progress: number;
    completed_intakes: number;
}

export interface ActivityFeedItem {
    id: string;
    event_type: 'intake' | 'document' | 'follow_up' | 'note';
    description: string;
    created_at: string;
    client_name: string;
}

export interface DashboardStats {
    intakeTrends: IntakeTrend[];
    staffWorkload: StaffWorkload[];
    myWorkload: MyWorkload | null;
    recentActivity: ActivityFeedItem[];
}
