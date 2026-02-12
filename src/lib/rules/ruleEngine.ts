import { IntakeFormData } from '@/features/intake/intakeTypes';

export interface RuleCondition {
    field: string;
    op: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
    value: any;
}

export interface RuleAction {
    action: 'hide_step' | 'show_step' | 'require_field' | 'set_value';
    target: string; // step name or field name
    value?: any;
}

export interface IntakeRule {
    id: string;
    rule_code: string;
    trigger_context: string;
    condition_json: RuleCondition;
    action_json: RuleAction;
    active: boolean;
}

export function evaluateRule(rule: IntakeRule, data: IntakeFormData | any): boolean {
    if (!rule.active) return false;

    const { field, op, value } = rule.condition_json;
    const actualValue = getNestedValue(data, field);

    switch (op) {
        case 'eq':
            return actualValue === value;
        case 'neq':
            return actualValue !== value;
        case 'contains':
            return Array.isArray(actualValue) && actualValue.includes(value);
        case 'gt':
            return Number(actualValue) > Number(value);
        case 'lt':
            return Number(actualValue) < Number(value);
        default:
            return false;
    }
}

// Helper to get nested values like 'medical.condition' from data object
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : undefined;
    }, obj);
}

export function applyRules(rules: IntakeRule[], data: IntakeFormData | any) {
    const effects = {
        hiddenSteps: new Set<string>(),
        requiredFields: new Set<string>(),
    };

    rules.forEach(rule => {
        if (evaluateRule(rule, data)) {
            const { action, target } = rule.action_json;
            if (action === 'hide_step') {
                effects.hiddenSteps.add(target);
            } else if (action === 'require_field') {
                effects.requiredFields.add(target);
            }
        }
    });

    return effects;
}
