/**
 * SECURITY: Data Masking Utility
 * 
 * Provides functions to sanitize PII/PHI before logging or 
 * external transmission, ensuring HIPAA compliance.
 */

export const Masking = {
    /**
     * Masks an email address: u***r@example.com
     */
    email(email: string | null | undefined): string {
        if (!email) return 'N/A';
        const [local, domain] = email.split('@');
        if (!domain) return '***';
        return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
    },

    /**
     * Masks an SSN: XXX-XX-1234
     */
    ssn(ssn: string | null | undefined): string {
        if (!ssn) return 'N/A';
        const clean = ssn.replace(/[^0-9]/g, '');
        if (clean.length < 4) return '***';
        return `XXX-XX-${clean.slice(-4)}`;
    },

    /**
     * Masks a phone number: (XXX) XXX-1234
     */
    phone(phone: string | null | undefined): string {
        if (!phone) return 'N/A';
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length < 4) return '***';
        return `(XXX) XXX-${clean.slice(-4)}`;
    },

    /**
     * Masks a name: J*** Doe
     */
    name(name: string | null | undefined): string {
        if (!name) return 'N/A';
        const parts = name.trim().split(/\s+/);
        return parts.map(part => {
            if (part.length <= 1) return part;
            return `${part.charAt(0)}***`;
        }).join(' ');
    },

    /**
     * Generic mask for unknown sensitive strings
     */
    generic(val: string | null | undefined): string {
        return val ? '***MASKED***' : 'N/A';
    },

    /**
     * Recursively masks an object based on key patterns
     */
    maskObject(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;

        const masked: any = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            const val = obj[key];
            const lowerKey = key.toLowerCase();

            if (typeof val === 'string') {
                if (lowerKey.includes('ssn')) masked[key] = this.ssn(val);
                else if (lowerKey.includes('email')) masked[key] = this.email(val);
                else if (lowerKey.includes('phone') || lowerKey.includes('tel')) masked[key] = this.phone(val);
                else if (lowerKey.includes('name') || lowerKey.includes('contact')) masked[key] = this.name(val);
                else if (lowerKey.includes('address')) masked[key] = this.generic(val);
                else masked[key] = val;
            } else if (typeof val === 'object' && val !== null) {
                masked[key] = this.maskObject(val);
            } else {
                masked[key] = val;
            }
        }

        return masked;
    }
};
