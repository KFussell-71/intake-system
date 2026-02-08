export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'radio' | 'textarea' | 'email' | 'tel' | 'date' | 'password';
    options?: { label: string; value: string }[];
    required?: boolean;
    helperText?: string;
    placeholder?: string;
}

export interface FormSchema {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
}

export type FormResponseData = Record<string, string | number | boolean | null | string[]>;

export interface AssessmentSubmission {
    id: string;
    formId: string;
    title: string;
    date: string;
    data: FormResponseData;
}
