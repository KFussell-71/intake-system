
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IntakeRule, applyRules } from '@/lib/rules/ruleEngine';
import { IntakeData } from '@/features/intake/types/intake';

export function useIntakeRules(formData: IntakeData | null) {
    const [rules, setRules] = useState<IntakeRule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('intake_rules')
                .select('*')
                .eq('active', true);

            if (!error && data) {
                setRules(data as unknown as IntakeRule[]);
            }
            setLoading(false);
        };

        fetchRules();
    }, []);

    const effects = useMemo(() => {
        if (!formData || rules.length === 0) return { hiddenSteps: new Set<string>(), requiredFields: new Set<string>() };
        return applyRules(rules, formData);
    }, [rules, formData]);

    return {
        rules,
        loading,
        hiddenSteps: effects.hiddenSteps,
        requiredFields: effects.requiredFields
    };
}
