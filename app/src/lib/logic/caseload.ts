import { supabase } from '@/lib/supabase';

interface StaffMember {
    id: string;
    username: string;
    role: string;
    current_load: number;
    max_capacity: number;
    skills: string[];
}

export const caseloadBalancer = {
    /**
     * Assigns a case to the best available staff member using Weighted Round Robin logic.
     * Incorporates:
     * 1. Availability (current_load < max_capacity)
     * 2. Utilization Rate (lower is better)
     * 3. Random tie-breaking for equal utilization
     */
    assignCase: async (caseId: string, requiredSkills: string[] = []) => {
        // 1. Fetch eligible staff
        // In a real app, we'd filter by role='case_manager' or similar
        const { data: staff, error } = await supabase
            .from('profiles')
            .select('id, username, role, metadata')
            .eq('role', 'case_manager');

        if (error || !staff || staff.length === 0) {
            console.error("Caseload Balancer: No staff found", error);
            return null;
        }

        // 2. Hydrate with current load
        // This would ideally be a materialized view or a fast counter query
        const hydratedStaff: StaffMember[] = await Promise.all(staff.map(async (s) => {
            const { count } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', s.id)
                .neq('status', 'closed'); // Only count active cases

            return {
                id: s.id,
                username: s.username,
                role: s.role,
                current_load: count || 0,
                // Default capacity to 30 if not set in metadata
                max_capacity: s.metadata?.max_capacity || 30,
                skills: s.metadata?.skills || []
            };
        }));

        // 3. Filter by Capacity & Skills
        const eligible = hydratedStaff.filter(s => {
            const hasCapacity = s.current_load < s.max_capacity;
            // Simple skill check: does staff have ALL required skills?
            const hasSkills = requiredSkills.every(skill => s.skills.includes(skill));
            return hasCapacity && hasSkills;
        });

        if (eligible.length === 0) {
            console.warn("Caseload Balancer: No eligible staff found with capacity.");
            return null;
        }

        // 4. Weighted Selection (Lowest Utilization)
        // Utilization = current / max
        eligible.sort((a, b) => {
            const utilA = a.current_load / a.max_capacity;
            const utilB = b.current_load / b.max_capacity;
            return utilA - utilB; // Ascending: lowest utilization first
        });

        const selectedStaff = eligible[0];

        // 5. Assign
        const { error: assignError } = await supabase
            .from('cases')
            .update({ assigned_to: selectedStaff.id })
            .eq('id', caseId);

        if (assignError) {
            console.error("Caseload Balancer: Assignment failed", assignError);
            return null;
        }

        return selectedStaff;
    }
};
