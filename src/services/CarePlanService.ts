import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { CarePlan, CarePlanGoal, CarePlanAction, CarePlanStatus, GoalCategory, ActionRole } from '@/types/case';

export class CarePlanService {
    /**
     * Get the active or latest care plan for a case
     */
    async getPlanByCaseId(caseId: string): Promise<CarePlan | null> {
        const { data, error } = await supabase
            .from('care_plans')
            .select('*')
            .eq('case_id', caseId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Create a new draft care plan
     */
    async createPlan(caseId: string): Promise<CarePlan> {
        const { data, error } = await supabase
            .from('care_plans')
            .insert({ case_id: caseId, status: 'draft' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update care plan status
     */
    async updatePlanStatus(planId: string, status: CarePlanStatus): Promise<CarePlan> {
        const { data, error } = await supabase
            .from('care_plans')
            .update({ status })
            .eq('id', planId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // --- Goals ---

    async getGoals(planId: string): Promise<(CarePlanGoal & { actions: CarePlanAction[] })[]> {
        // Fetch goals
        const { data: goals, error: goalsError } = await supabase
            .from('care_plan_goals')
            .select('*')
            .eq('plan_id', planId)
            .order('created_at', { ascending: true });

        if (goalsError) throw goalsError;
        if (!goals?.length) return [];

        // Fetch actions for these goals
        const goalIds = goals.map(g => g.id);
        const { data: actions, error: actionsError } = await supabase
            .from('care_plan_actions')
            .select('*')
            .in('goal_id', goalIds)
            .order('created_at', { ascending: true });

        if (actionsError) throw actionsError;

        // Combine
        return goals.map(goal => ({
            ...goal,
            actions: actions?.filter(a => a.goal_id === goal.id) || []
        }));
    }

    async addGoal(planId: string, goal: { description: string, category: GoalCategory, target_date?: string }): Promise<CarePlanGoal> {
        const { data, error } = await supabase
            .from('care_plan_goals')
            .insert({
                plan_id: planId,
                description: goal.description,
                category: goal.category,
                target_date: goal.target_date,
                status: 'not_started'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateGoal(goalId: string, updates: Partial<CarePlanGoal>): Promise<CarePlanGoal> {
        const { data, error } = await supabase
            .from('care_plan_goals')
            .update(updates)
            .eq('id', goalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteGoal(goalId: string): Promise<void> {
        const { error } = await supabase
            .from('care_plan_goals')
            .delete()
            .eq('id', goalId);

        if (error) throw error;
    }

    // --- Actions ---

    async addAction(goalId: string, action: { description: string, assigned_to_role?: ActionRole, target_date?: string }): Promise<CarePlanAction> {
        const { data, error } = await supabase
            .from('care_plan_actions')
            .insert({
                goal_id: goalId,
                description: action.description,
                assigned_to_role: action.assigned_to_role || 'case_worker',
                target_date: action.target_date,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateAction(actionId: string, updates: Partial<CarePlanAction>): Promise<CarePlanAction> {
        const { data, error } = await supabase
            .from('care_plan_actions')
            .update(updates)
            .eq('id', actionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteAction(actionId: string): Promise<void> {
        const { error } = await supabase
            .from('care_plan_actions')
            .delete()
            .eq('id', actionId);

        if (error) throw error;
    }
}

export const carePlanService = new CarePlanService();
