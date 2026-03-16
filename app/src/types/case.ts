export type CaseStatus = 'active' | 'closed' | 'transferred';
export type CaseStage = 'intake' | 'assessment' | 'planning' | 'service_delivery' | 'review';

export interface Case {
    id: string;
    client_id: string;
    clientId?: string; // Alias for Prisma
    assigned_to?: string;
    assignedToId?: string; // Alias for Prisma
    status: CaseStatus;
    stage: CaseStage;
    start_date: string;
    startDate?: Date; // Alias for Prisma
    closed_date?: string;
    closure_reason?: string;
    intake_id: string;
    intakeId?: string; // Alias for Prisma
    created_at: string;
    createdAt?: Date; // Alias for Prisma
    updated_at: string;
    updatedAt?: Date; // Alias for Prisma
    client?: {
        name: string;
        full_name?: string;
        email?: string;
        phone?: string;
    };
}

export type CarePlanStatus = 'draft' | 'active' | 'completed' | 'revised';

export interface CarePlan {
    id: string;
    case_id: string;
    status: CarePlanStatus;
    start_date: string;
    review_date?: string;
    created_at: string;
    updated_at: string;
}

export type GoalCategory = 'housing' | 'employment' | 'health' | 'education' | 'legal' | 'finance' | 'social' | 'other';
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'abandoned';

export interface CarePlanGoal {
    id: string;
    plan_id: string;
    description: string;
    category: GoalCategory;
    status: GoalStatus;
    target_date?: string;
    progress_notes?: string;
    created_at: string;
    updated_at: string;
}

export type ActionRole = 'client' | 'case_worker' | 'external_provider';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CarePlanAction {
    id: string;
    goal_id: string;
    description: string;
    assigned_to_role?: ActionRole;
    status: ActionStatus;
    target_date?: string;
    completion_date?: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceLog {
    id: string;
    case_id: string;
    provider_id?: string;
    service_type: string;
    performed_at: string;
    duration_minutes?: number;
    notes?: string;
    outcome?: string;
    created_at: string;
    updated_at: string;
}

export type FollowUpType = 'check_in' | 'assessment' | 'service' | 'planning';
export type FollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export interface FollowUp {
    id: string;
    case_id: string;
    scheduled_date: string;
    type: FollowUpType;
    status: FollowUpStatus;
    notes?: string;
    created_at: string;
    updated_at: string;
}
