export type IntakeResponse = Record<string, any>;

export interface LogicRule {
    triggerField: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    action: 'show' | 'hide' | 'require';
    targetField: string;
}

export const skipLogicEngine = {
    /**
     * Evaluates whether a field should be shown based on current responses and rules.
     * Default rule is "show" if no rules apply.
     */
    evaluateShow: (fieldName: string, currentResponses: IntakeResponse, rules: LogicRule[]): boolean => {
        // Find rules that target this field with 'show' or 'hide' actions
        const targetRules = rules.filter(r => r.targetField === fieldName && ['show', 'hide'].includes(r.action));

        if (targetRules.length === 0) return true; // Default to visible

        // If multiple rules exist, we need to decide strategy. 
        // Strategy: "Hide by default if any rule exists, then show if any rule condition is met" is common.
        // OR: "Show by default, hide if trigger met".

        // Let's implement: Hidden by default if it has a dependency, Visible only if trigger met.

        // Check if ANY 'show' rule is satisfied
        const showRules = targetRules.filter(r => r.action === 'show');
        if (showRules.length > 0) {
            return showRules.some(rule => evaluateCondition(rule, currentResponses));
        }

        // Check if ANY 'hide' rule is satisfied
        const hideRules = targetRules.filter(r => r.action === 'hide');
        if (hideRules.length > 0) {
            return !hideRules.some(rule => evaluateCondition(rule, currentResponses));
        }

        return true;
    }
};

function evaluateCondition(rule: LogicRule, responses: IntakeResponse): boolean {
    const actualValue = responses[rule.triggerField];

    // Handle undefined/null gracefully
    if (actualValue === undefined || actualValue === null) return false;

    switch (rule.operator) {
        case 'equals':
            return actualValue == rule.value;
        case 'not_equals':
            return actualValue != rule.value;
        case 'contains':
            return Array.isArray(actualValue)
                ? actualValue.includes(rule.value)
                : String(actualValue).includes(String(rule.value));
        case 'greater_than':
            return Number(actualValue) > Number(rule.value);
        case 'less_than':
            return Number(actualValue) < Number(rule.value);
        default:
            return false;
    }
}
