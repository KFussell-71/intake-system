/**
 * HIPAA Authorization for Release of Health Information
 * TypeScript interface for form data storage
 */

export interface HIPAAAuthorizationData {
    // Header Info (Auto-populated)
    patientFirstName: string;
    patientLastName: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    dateOfInitialAssessment: string;

    // Item 7: Health Provider releasing info
    providerName: string;
    providerAddress: string;
    providerCity: string;
    providerState: string;
    providerZip: string;
    providerPhone: string;

    // Item 8: Recipient of info
    recipientName: string;
    recipientAddress: string;
    recipientCity: string;
    recipientState: string;
    recipientZip: string;

    // Item 9(a): Record types
    recordType: 'entire' | 'specific_dates' | 'other';
    specificDatesFrom: string;
    specificDatesTo: string;
    otherRecordsDescription: string;

    // Item 9(a): Special categories (initials required)
    includeAlcoholDrug: boolean;
    includeMentalHealth: boolean;
    includeHIV: boolean;
    includeGenetic: boolean;
    otherCategories: string;

    // Item 9(b-d): Authorization to discuss
    authorizeDiscussion: boolean;
    healthcareProviderName: string;  // 9(c)
    attorneyOrAgencyName: string;    // 9(d)

    // Item 10: Reason for release
    releaseReason: 'personal' | 'other';
    releaseReasonOther: string;

    // Item 11: Expiration
    expirationDate: string;

    // Item 12-13: Representative signing
    representativeName: string;
    representativeAuthority: string;

    // Signature capture
    signatureDataUrl: string;        // Base64 PNG of signature
    signatureDate: string;
    signedByPatient: boolean;

    // Metadata
    formId: string;
    createdAt: string;
    updatedAt: string;
}

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
