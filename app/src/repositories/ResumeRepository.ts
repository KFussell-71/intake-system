import { BaseRepository } from './BaseRepository';

export interface ClientResume {
    id: string;
    client_id: string;
    intake_id: string;
    resume_id: string; // External resume builder ID or internal ID
    resume_url: string;
    pdf_url?: string;
    version: number;
    is_active: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface CreateResumeData {
    client_id: string;
    intake_id: string;
    resume_id: string;
    resume_url: string;
    pdf_url?: string;
    metadata?: Record<string, any>;
}

export class ResumeRepository extends BaseRepository {
    /**
     * Create a new resume record
     */
    async createResume(data: CreateResumeData): Promise<ClientResume> {
        // Get the next version number for this client
        const { data: existingResumes } = await this.db
            .from('client_resumes')
            .select('version')
            .eq('client_id', data.client_id)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = existingResumes && existingResumes.length > 0
            ? existingResumes[0].version + 1
            : 1;

        const { data: resume, error } = await this.db
            .from('client_resumes')
            .insert({
                ...data,
                version: nextVersion,
            })
            .select()
            .single();

        if (error) this.handleError(error, 'createResume');

        // Log the generation
        await this.logResumeAction(resume.id, 'generated');

        return resume;
    }

    /**
     * Get all resumes for a client
     */
    async getResumesByClient(clientId: string): Promise<ClientResume[]> {
        const { data, error } = await this.db
            .from('client_resumes')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'getResumesByClient');
        return data || [];
    }

    /**
     * Get the latest active resume for a client
     */
    async getLatestResume(clientId: string): Promise<ClientResume | null> {
        const { data, error } = await this.db
            .from('client_resumes')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) this.handleError(error, 'getLatestResume');
        return data;
    }

    /**
     * Get a specific resume by ID
     */
    async getResumeById(resumeId: string): Promise<ClientResume | null> {
        const { data, error } = await this.db
            .from('client_resumes')
            .select('*')
            .eq('id', resumeId)
            .maybeSingle();

        if (error) this.handleError(error, 'getResumeById');
        return data;
    }

    /**
     * Update resume PDF URL after export
     */
    async updatePdfUrl(resumeId: string, pdfUrl: string): Promise<void> {
        const { error } = await this.db
            .from('client_resumes')
            .update({ pdf_url: pdfUrl })
            .eq('id', resumeId);

        if (error) this.handleError(error, 'updatePdfUrl');

        await this.logResumeAction(resumeId, 'pdf_generated');
    }

    /**
     * Deactivate old resumes when a new one is created
     */
    async deactivateOldResumes(clientId: string, exceptResumeId?: string): Promise<void> {
        const query = this.db
            .from('client_resumes')
            .update({ is_active: false })
            .eq('client_id', clientId);

        if (exceptResumeId) {
            query.neq('id', exceptResumeId);
        }

        const { error } = await query;

        if (error) this.handleError(error, 'deactivateOldResumes');
    }

    /**
     * Delete a resume
     */
    async deleteResume(resumeId: string): Promise<void> {
        const { error } = await this.db
            .from('client_resumes')
            .delete()
            .eq('id', resumeId);

        if (error) this.handleError(error, 'deleteResume');

        await this.logResumeAction(resumeId, 'deleted');
    }

    /**
     * Log resume action for audit trail
     */
    private async logResumeAction(
        resumeId: string,
        action: 'generated' | 'updated' | 'downloaded' | 'pdf_generated' | 'deleted',
        metadata?: Record<string, any>
    ): Promise<void> {
        const { data: { user } } = await this.db.auth.getUser();

        await this.db
            .from('resume_generation_logs')
            .insert({
                resume_id: resumeId,
                action,
                performed_by: user?.id,
                metadata: metadata || {},
            });
    }

    /**
     * Get resume generation logs
     */
    async getResumeLogs(resumeId: string): Promise<any[]> {
        const { data, error } = await this.db
            .from('resume_generation_logs')
            .select(`
                *,
                profiles:performed_by (
                    id,
                    email,
                    role
                )
            `)
            .eq('resume_id', resumeId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'getResumeLogs');
        return data || [];
    }

    /**
     * Get resume statistics for a client
     */
    async getResumeStats(clientId: string): Promise<{
        total: number;
        active: number;
        lastGenerated?: string;
    }> {
        const { data, error } = await this.db
            .from('client_resumes')
            .select('id, is_active, created_at')
            .eq('client_id', clientId);

        if (error) this.handleError(error, 'getResumeStats');

        const resumes = data || [];
        const active = resumes.filter(r => r.is_active).length;
        const lastGenerated = resumes.length > 0
            ? resumes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : undefined;

        return {
            total: resumes.length,
            active,
            lastGenerated,
        };
    }
}

export const resumeRepository = new ResumeRepository();
