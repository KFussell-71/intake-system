import { IntakeRule } from './ruleEngine';

/**
 * PHASE 9.3: DETERMINISTIC CLINICAL GUARDRAILS
 * 
 * Hard-coded validation rules that enforce non-negotiable business logic.
 * These rules supplement the AI Compliance Agent with deterministic checks.
 */

export const CLINICAL_VALIDATION_RULES: IntakeRule[] = [
    {
        id: 'cv-001',
        rule_code: 'MOBILITY_REQUIRED_FOR_PHYSICAL_DISABILITY',
        trigger_context: 'medical_evaluation',
        condition_json: {
            field: 'medicalConditionCurrent',
            op: 'eq',
            value: true
        },
        action_json: {
            action: 'validate',
            target: 'mobilityStatus',
            errorMessage: 'Mobility status must be specified when a physical condition is present.'
        },
        active: true
    },
    {
        id: 'cv-002',
        rule_code: 'DIAGNOSIS_CODE_REQUIRED_FOR_CONDITION',
        trigger_context: 'medical_evaluation',
        condition_json: {
            field: 'medicalConditionCurrent',
            op: 'eq',
            value: true
        },
        action_json: {
            action: 'validate',
            target: 'primaryDiagnosisCode',
            errorMessage: 'Primary diagnosis code is required when a medical condition is documented.'
        },
        active: true
    },
    {
        id: 'cv-003',
        rule_code: 'FUNCTIONAL_LIMITATION_REQUIRED',
        trigger_context: 'medical_evaluation',
        condition_json: {
            field: 'medicalEmploymentImpact',
            op: 'eq',
            value: ''
        },
        action_json: {
            action: 'validate',
            target: 'medicalEmploymentImpact',
            errorMessage: 'Functional limitations and employment impact must be documented for medical conditions.'
        },
        active: true
    },
    {
        id: 'cv-004',
        rule_code: 'CONSENT_REQUIRED_FOR_SUBMISSION',
        trigger_context: 'submission',
        condition_json: {
            field: 'consentToRelease',
            op: 'eq',
            value: false
        },
        action_json: {
            action: 'validate',
            target: 'consentToRelease',
            errorMessage: 'Consent to release information is required before submission.'
        },
        active: true
    },
    {
        id: 'cv-005',
        rule_code: 'CLINICAL_RATIONALE_REQUIRED',
        trigger_context: 'submission',
        condition_json: {
            field: 'clinicalRationale',
            op: 'eq',
            value: ''
        },
        action_json: {
            action: 'validate',
            target: 'clinicalRationale',
            errorMessage: 'Clinical rationale is required for VRC submission.'
        },
        active: true
    }
];

/**
 * Validates form data against clinical guardrails.
 * Returns validation errors for display in the UI.
 */
export function validateClinicalData(data: any): { field: string; message: string }[] {
    const errors: { field: string; message: string }[] = [];

    // CV-001: Mobility status required for physical conditions
    if (data.medicalConditionCurrent && (!data.mobilityStatus || data.mobilityStatus === '')) {
        errors.push({
            field: 'mobilityStatus',
            message: 'Mobility status must be specified when a physical condition is present.'
        });
    }

    // CV-002: Diagnosis code required for conditions
    if (data.medicalConditionCurrent && (!data.primaryDiagnosisCode || data.primaryDiagnosisCode.trim() === '')) {
        errors.push({
            field: 'primaryDiagnosisCode',
            message: 'Primary diagnosis code is required when a medical condition is documented.'
        });
    }

    // CV-003: Functional limitation documentation required
    if (data.medicalConditionCurrent && (!data.medicalEmploymentImpact || data.medicalEmploymentImpact.trim() === '')) {
        errors.push({
            field: 'medicalEmploymentImpact',
            message: 'Functional limitations and employment impact must be documented for medical conditions.'
        });
    }

    return errors;
}
