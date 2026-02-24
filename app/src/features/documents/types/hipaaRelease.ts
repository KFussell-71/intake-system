/**
 * HIPAA Authorization for Release of Health Information
 * TypeScript interface for form data storage
 */

export interface HIPAAPatientInfo {
    patientFirstName: string;
    patientLastName: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    dateOfInitialAssessment: string;
}

export interface HIPAAProviderInfo {
    providerName: string;
    providerAddress: string;
    providerCity: string;
    providerState: string;
    providerZip: string;
    providerPhone: string;
}

export interface HIPAARecipientInfo {
    recipientName: string;
    recipientAddress: string;
    recipientCity: string;
    recipientState: string;
    recipientZip: string;
}

export interface HIPAAAuthorizationDetails {
    // Record types
    recordType: 'entire' | 'specific_dates' | 'other';
    specificDatesFrom: string;
    specificDatesTo: string;
    otherRecordsDescription: string;

    // Special categories
    includeAlcoholDrug: boolean;
    includeMentalHealth: boolean;
    includeHIV: boolean;
    includeGenetic: boolean;
    otherCategories: string;

    // Authorization to discuss
    authorizeDiscussion: boolean;
    healthcareProviderName: string;
    attorneyOrAgencyName: string;

    // Reason and Expiration
    releaseReason: 'personal' | 'other';
    releaseReasonOther: string;
    expirationDate: string;
}

export interface HIPAAExecution {
    representativeName: string;
    representativeAuthority: string;
    signatureDataUrl: string;
    signatureDate: string;
    signedByPatient: boolean;
}

export interface HIPAAMetadata {
    formId: string;
    createdAt: string;
    updatedAt: string;
}

export type HIPAAAuthorizationData = HIPAAPatientInfo & HIPAAProviderInfo & HIPAARecipientInfo & HIPAAAuthorizationDetails & HIPAAExecution & HIPAAMetadata;

export const initialHIPAAData: HIPAAAuthorizationData = {
    patientFirstName: '',
    patientLastName: '',
    dateOfBirth: '',
    medicalRecordNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    dateOfInitialAssessment: '',
    providerName: '',
    providerAddress: '',
    providerCity: '',
    providerState: '',
    providerZip: '',
    providerPhone: '',
    recipientName: '',
    recipientAddress: '',
    recipientCity: '',
    recipientState: '',
    recipientZip: '',
    recordType: 'entire',
    specificDatesFrom: '',
    specificDatesTo: '',
    otherRecordsDescription: '',
    includeAlcoholDrug: false,
    includeMentalHealth: false,
    includeHIV: false,
    includeGenetic: false,
    otherCategories: '',
    authorizeDiscussion: false,
    healthcareProviderName: '',
    attorneyOrAgencyName: '',
    releaseReason: 'personal',
    releaseReasonOther: '',
    expirationDate: '',
    representativeName: '',
    representativeAuthority: '',
    signatureDataUrl: '',
    signatureDate: '',
    signedByPatient: true,
    formId: '',
    createdAt: '',
    updatedAt: '',
};
