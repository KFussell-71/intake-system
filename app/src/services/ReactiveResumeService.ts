import { JSONResume } from './ResumeMapperService';

export interface ReactiveResumeResponse {
    id: string;
    slug: string;
    title: string;
    url: string;
}

export interface ResumeExportOptions {
    format: 'pdf' | 'json';
    template?: string;
}

export class ReactiveResumeService {
    private apiUrl: string;
    private publicUrl: string;
    private printerUrl: string;
    private apiKey: string;

    constructor() {
        this.apiUrl = process.env.NEXT_PUBLIC_RESUME_API_URL || 'http://localhost:3001/api';
        this.publicUrl = process.env.NEXT_PUBLIC_RESUME_PUBLIC_URL || 'http://localhost:3001';
        this.printerUrl = process.env.NEXT_PUBLIC_RESUME_PRINTER_URL || 'http://localhost:8080';
        this.apiKey = process.env.RESUME_API_KEY || '';
    }

    /**
     * Check if Reactive Resume is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.publicUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch (error) {
            console.warn('[ReactiveResume] Service not available:', error);
            return false;
        }
    }

    /**
     * Create a resume in Reactive Resume
     */
    async createResume(
        jsonResume: JSONResume,
        clientId: string,
        title?: string
    ): Promise<ReactiveResumeResponse> {
        const response = await fetch(`${this.apiUrl}/resumes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                title: title || `${jsonResume.basics.name} - Resume`,
                slug: `client-${clientId}-${Date.now()}`,
                data: jsonResume,
                visibility: 'private',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create resume: ${response.statusText} - ${error}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            slug: data.slug,
            title: data.title,
            url: `${this.publicUrl}/resume/${data.id}`,
        };
    }

    /**
     * Update an existing resume
     */
    async updateResume(resumeId: string, jsonResume: JSONResume): Promise<void> {
        const response = await fetch(`${this.apiUrl}/resumes/${resumeId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                data: jsonResume,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update resume: ${response.statusText} - ${error}`);
        }
    }

    /**
     * Get resume data
     */
    async getResume(resumeId: string): Promise<JSONResume> {
        const response = await fetch(`${this.apiUrl}/resumes/${resumeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get resume: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data as JSONResume;
    }

    /**
     * Export resume to PDF
     */
    async exportToPDF(resumeId: string): Promise<Blob> {
        const resumeUrl = `${this.publicUrl}/resume/${resumeId}`;

        const response = await fetch(
            `${this.printerUrl}/print?url=${encodeURIComponent(resumeUrl)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to export PDF: ${response.statusText} - ${error}`);
        }

        return await response.blob();
    }

    /**
     * Delete a resume
     */
    async deleteResume(resumeId: string): Promise<void> {
        const response = await fetch(`${this.apiUrl}/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete resume: ${response.statusText}`);
        }
    }

    /**
     * Get editor URL for a resume
     */
    getEditorUrl(resumeId: string): string {
        return `${this.publicUrl}/builder/${resumeId}`;
    }

    /**
     * Get preview URL for a resume
     */
    getPreviewUrl(resumeId: string): string {
        return `${this.publicUrl}/resume/${resumeId}`;
    }

    /**
     * Upload resume to storage and get URL
     */
    async uploadPDF(blob: Blob, fileName: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const response = await fetch(`${this.apiUrl}/storage/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload PDF: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
    }
}

export const reactiveResumeService = new ReactiveResumeService();
