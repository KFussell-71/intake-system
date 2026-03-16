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
    upcoming_appointments: number;
}

export interface ActivityFeedItem {
    id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    message: string;
    created_at: string;
    metadata?: any;
}

export interface DashboardStats {
    intakeTrends: IntakeTrend[];
    staffWorkload: StaffWorkload[];
    myWorkload: MyWorkload | null;
    recentActivity: ActivityFeedItem[];
}
