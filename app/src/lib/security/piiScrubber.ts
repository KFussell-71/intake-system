
export function scrubPII(text: string): string {
    if (!text) return text;

    // SSN Pattern (Redaction)
    // Matches: 000-00-0000, 000 00 0000, or just 9 digits if clear context (but be careful of false positives)
    // We stick to standard formatted SSN to avoid destroying random numbers.
    const ssnPattern = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;

    // Phone Pattern
    // Matches: (555) 555-5555, 555-555-5555
    const phonePattern = /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

    // Email Pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    return text
        .replace(ssnPattern, '[REDACTED_SSN]')
        .replace(phonePattern, '[REDACTED_PHONE]')
        .replace(emailPattern, '[REDACTED_EMAIL]');
}

export function scrubObject(obj: any): any {
    if (typeof obj === 'string') {
        return scrubPII(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(scrubObject);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = scrubObject(obj[key]);
        }
        return newObj;
    }
    return obj;
}
