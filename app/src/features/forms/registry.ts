import { FormSchema } from "./types";

export const PHQ9_SCHEMA: FormSchema = {
    id: 'phq-9',
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    description: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    fields: [
        {
            name: 'q1',
            label: '1. Little interest or pleasure in doing things',
            type: 'radio',
            required: true,
            options: [
                { label: 'Not at all', value: '0' },
                { label: 'Several days', value: '1' },
                { label: 'More than half the days', value: '2' },
                { label: 'Nearly every day', value: '3' },
            ]
        },
        {
            name: 'q2',
            label: '2. Feeling down, depressed, or hopeless',
            type: 'radio',
            required: true,
            options: [
                { label: 'Not at all', value: '0' },
                { label: 'Several days', value: '1' },
                { label: 'More than half the days', value: '2' },
                { label: 'Nearly every day', value: '3' },
            ]
        },
        // Abridged for MVP
        {
            name: 'total_score',
            label: 'Total Score (Auto-calc future)',
            type: 'number',
        },
        {
            name: 'notes',
            label: 'Clinical Notes',
            type: 'textarea'
        }
    ]
};

export const GAD7_SCHEMA: FormSchema = {
    id: 'gad-7',
    title: 'GAD-7 (Generalized Anxiety Disorder-7)',
    description: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    fields: [
        {
            name: 'q1',
            label: '1. Feeling nervous, anxious or on edge',
            type: 'radio',
            required: true,
            options: [
                { label: 'Not at all', value: '0' },
                { label: 'Several days', value: '1' },
                { label: 'More than half the days', value: '2' },
                { label: 'Nearly every day', value: '3' },
            ]
        },
        {
            name: 'q2',
            label: '2. Not being able to stop or control worrying',
            type: 'radio',
            required: true,
            options: [
                { label: 'Not at all', value: '0' },
                { label: 'Several days', value: '1' },
                { label: 'More than half the days', value: '2' },
                { label: 'Nearly every day', value: '3' },
            ]
        }
    ]
};

export const FORM_REGISTRY = {
    'phq-9': PHQ9_SCHEMA,
    'gad-7': GAD7_SCHEMA,
};
