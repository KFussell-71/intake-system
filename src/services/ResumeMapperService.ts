import { supabase } from '@/lib/supabase/client';

/**
 * JSON Resume Schema (https://jsonresume.org/schema/)
 * Standard format for resume data
 */
export interface JSONResume {
    basics: {
        name: string;
        label?: string;
        email: string;
        phone: string;
        url?: string;
        summary?: string;
        location?: {
            address?: string;
            postalCode?: string;
            city?: string;
            countryCode?: string;
            region?: string;
        };
        profiles?: Array<{
            network: string;
            username: string;
            url: string;
        }>;
    };
    work?: Array<{
        name: string;
        position: string;
        url?: string;
        startDate: string;
        endDate?: string;
        summary?: string;
        highlights?: string[];
    }>;
    volunteer?: Array<{
        organization: string;
        position: string;
        url?: string;
        startDate: string;
        endDate?: string;
        summary?: string;
        highlights?: string[];
    }>;
    education?: Array<{
        institution: string;
        url?: string;
        area: string;
        studyType: string;
        startDate: string;
        endDate?: string;
        score?: string;
        courses?: string[];
    }>;
    awards?: Array<{
        title: string;
        date: string;
        awarder: string;
        summary?: string;
    }>;
    certificates?: Array<{
        name: string;
        date: string;
        issuer: string;
        url?: string;
    }>;
    publications?: Array<{
        name: string;
        publisher: string;
        releaseDate: string;
        url?: string;
        summary?: string;
    }>;
    skills?: Array<{
        name: string;
        level?: string;
        keywords?: string[];
    }>;
    languages?: Array<{
        language: string;
        fluency: string;
    }>;
    interests?: Array<{
        name: string;
        keywords?: string[];
    }>;
    references?: Array<{
        name: string;
        reference: string;
    }>;
    projects?: Array<{
        name: string;
        description?: string;
        highlights?: string[];
        keywords?: string[];
        startDate?: string;
        endDate?: string;
        url?: string;
        roles?: string[];
        entity?: string;
        type?: string;
    }>;
}

/**
 * Service to map intake data to JSON Resume format
 */
export class ResumeMapperService {
    /**
     * Generate a JSON Resume from intake data
     */
    async generateResumeFromIntake(intakeId: string): Promise<JSONResume> {
        // Fetch all relevant intake data
        const [identity, employment, barriers, observations] = await Promise.all([
            this.fetchIdentity(intakeId),
            this.fetchEmployment(intakeId),
            this.fetchBarriers(intakeId),
            this.fetchObservations(intakeId),
        ]);

        // Build JSON Resume
        const resume: JSONResume = {
            basics: this.mapBasics(identity),
            work: this.mapWork(employment),
            education: this.mapEducation(identity),
            skills: this.mapSkills(barriers, employment),
            certificates: this.mapCertificates(identity),
            volunteer: this.mapVolunteer(identity),
            languages: this.mapLanguages(identity),
        };

        // Add summary from counselor observations if available
        if (observations?.counselor_notes) {
            resume.basics.summary = this.generateSummary(observations, identity, employment);
        }

        return resume;
    }

    private async fetchIdentity(intakeId: string) {
        const { data } = await supabase
            .from('intake_identity')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();
        return data;
    }

    private async fetchEmployment(intakeId: string) {
        const { data } = await supabase
            .from('intake_employment')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();
        return data;
    }

    private async fetchBarriers(intakeId: string) {
        const { data } = await supabase
            .from('intake_barriers')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();
        return data;
    }

    private async fetchObservations(intakeId: string) {
        const { data } = await supabase
            .from('observations')
            .select('*')
            .eq('intake_id', intakeId)
            .eq('domain', 'employment')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        return data;
    }

    private mapBasics(identity: any): JSONResume['basics'] {
        if (!identity) {
            return {
                name: 'Client',
                email: '',
                phone: '',
                summary: 'Seeking employment opportunities',
            };
        }

        return {
            name: `${identity.first_name || ''} ${identity.last_name || ''}`.trim() || 'Client',
            email: identity.email || '',
            phone: identity.phone || '',
            location: {
                address: identity.address || undefined,
                city: identity.city || undefined,
                region: identity.state || undefined,
                postalCode: identity.zip_code || undefined,
                countryCode: 'US',
            },
            summary: 'Motivated professional seeking new opportunities',
        };
    }

    private mapWork(employment: any): JSONResume['work'] {
        if (!employment?.data?.employment_history || !Array.isArray(employment.data.employment_history)) {
            return [];
        }

        return employment.data.employment_history
            .filter((job: any) => job && (job.employer || job.position))
            .map((job: any) => ({
                name: job.employer || 'Previous Employer',
                position: job.position || 'Employee',
                startDate: job.start_date || '',
                endDate: job.end_date || job.currently_employed ? undefined : '',
                summary: job.responsibilities || job.description || '',
                highlights: job.achievements ? [job.achievements] : [],
            }));
    }

    private mapEducation(identity: any): JSONResume['education'] {
        if (!identity?.data?.education) return [];

        const education = identity.data.education;
        const result: JSONResume['education'] = [];

        // High School
        if (education.high_school) {
            result.push({
                institution: education.high_school_name || 'High School',
                area: 'General Studies',
                studyType: 'High School Diploma',
                startDate: '',
                endDate: education.high_school_graduation_year || '',
            });
        }

        // College/University
        if (education.college) {
            result.push({
                institution: education.college_name || 'College',
                area: education.major || 'General Studies',
                studyType: education.degree || 'Associate Degree',
                startDate: '',
                endDate: education.college_graduation_year || '',
            });
        }

        // Vocational/Technical
        if (education.vocational) {
            result.push({
                institution: education.vocational_school || 'Vocational School',
                area: education.vocational_program || 'Technical Training',
                studyType: 'Certificate',
                startDate: '',
                endDate: education.vocational_completion_year || '',
            });
        }

        return result;
    }

    private mapSkills(barriers: any, employment: any): JSONResume['skills'] {
        const skills: JSONResume['skills'] = [];

        // From barriers assessment
        if (barriers?.data?.skills && Array.isArray(barriers.data.skills)) {
            skills.push({
                name: 'Professional Skills',
                keywords: barriers.data.skills,
            });
        }

        // From employment data
        if (employment?.data?.skills) {
            const employmentSkills = typeof employment.data.skills === 'string'
                ? employment.data.skills.split(',').map((s: string) => s.trim())
                : employment.data.skills;

            if (employmentSkills.length > 0) {
                skills.push({
                    name: 'Technical Skills',
                    keywords: employmentSkills,
                });
            }
        }

        // Soft skills from barriers
        if (barriers?.data?.soft_skills && Array.isArray(barriers.data.soft_skills)) {
            skills.push({
                name: 'Soft Skills',
                keywords: barriers.data.soft_skills,
            });
        }

        return skills;
    }

    private mapCertificates(identity: any): JSONResume['certificates'] {
        if (!identity?.data?.certifications || !Array.isArray(identity.data.certifications)) {
            return [];
        }

        return identity.data.certifications
            .filter((cert: any) => cert && cert.name)
            .map((cert: any) => ({
                name: cert.name,
                date: cert.date || cert.year || '',
                issuer: cert.issuer || cert.organization || 'Certifying Organization',
                url: cert.url || undefined,
            }));
    }

    private mapVolunteer(identity: any): JSONResume['volunteer'] {
        if (!identity?.data?.volunteer_experience || !Array.isArray(identity.data.volunteer_experience)) {
            return [];
        }

        return identity.data.volunteer_experience
            .filter((vol: any) => vol && vol.organization)
            .map((vol: any) => ({
                organization: vol.organization,
                position: vol.role || 'Volunteer',
                startDate: vol.start_date || '',
                endDate: vol.end_date || undefined,
                summary: vol.description || '',
                highlights: vol.achievements ? [vol.achievements] : [],
            }));
    }

    private mapLanguages(identity: any): JSONResume['languages'] {
        if (!identity?.data?.languages || !Array.isArray(identity.data.languages)) {
            return [{ language: 'English', fluency: 'Native' }];
        }

        return identity.data.languages.map((lang: any) => ({
            language: typeof lang === 'string' ? lang : lang.name,
            fluency: typeof lang === 'object' ? lang.fluency || 'Fluent' : 'Fluent',
        }));
    }

    private generateSummary(observations: any, identity: any, employment: any): string {
        // Use counselor notes as base
        let summary = observations.counselor_notes || '';

        // If no counselor notes, generate a basic summary
        if (!summary) {
            const yearsExperience = employment?.data?.years_of_experience || 0;
            const hasEducation = identity?.data?.education?.college || identity?.data?.education?.high_school;

            summary = `Motivated professional ${yearsExperience > 0 ? `with ${yearsExperience} years of experience` : 'seeking new opportunities'}. `;

            if (hasEducation) {
                summary += 'Committed to continuous learning and professional development. ';
            }

            summary += 'Ready to contribute skills and dedication to a dynamic team.';
        }

        return summary;
    }

    /**
     * Export resume to JSON file
     */
    exportToJSON(resume: JSONResume): string {
        return JSON.stringify(resume, null, 2);
    }

    /**
     * Validate JSON Resume schema
     */
    validateResume(resume: JSONResume): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!resume.basics) {
            errors.push('Missing basics section');
        } else {
            if (!resume.basics.name) errors.push('Missing name in basics');
            if (!resume.basics.email) errors.push('Missing email in basics');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

export const resumeMapperService = new ResumeMapperService();
