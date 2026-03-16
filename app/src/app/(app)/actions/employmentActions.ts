'use server';

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { VocationalData } from '@/features/intake/intakeTypes';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';
import { auditService } from '@/services/auditService';

/**
 * Saves Employment, Education, and Vocational Goal data using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function saveEmploymentAction(intakeId: string, data: Partial<VocationalData>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    const validation = validateSection('employment', data);
    if (!validation.success) {
        return { success: false, error: `Validation Failed: ${validation.error}` };
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Upsert Employment Data
            await tx.intakeEmployment.upsert({
                where: { intakeId },
                update: {
                    ...data as any, // TypeScript casting for Partial map
                    updatedBy: auth.userId,
                    updatedAt: new Date()
                },
                create: {
                    intakeId,
                    ...data as any,
                    updatedBy: auth.userId!
                }
            });

            // 2. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'intake_employment',
                entityId: intakeId,
                details: { updatedFields: Object.keys(data) }
            });

            // 3. Legacy Intake Event
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'field_update',
                    fieldPath: 'employment_domain',
                    newValue: `Updated ${Object.keys(data).length} vocational fields`,
                    changedBy: auth.userId
                }
            });

            // 4. Update Section Status
            await tx.intakeSection.upsert({
                where: { intakeId_sectionName: { intakeId, sectionName: 'employment' } },
                update: { status: (data as any).sectionStatus || 'in_progress', lastUpdatedBy: auth.userId, updatedAt: new Date() },
                create: { intakeId, sectionName: 'employment', status: (data as any).sectionStatus || 'in_progress', lastUpdatedBy: auth.userId }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath(`/modernized-intake/${intakeId}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error saving employment data:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Server Action: Get Vocational and Employment Data using Prisma.
 */
export async function getVocationalAction(intakeId: string): Promise<{ success: boolean; data?: VocationalData; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    try {
        const [relational, section] = await Promise.all([
            prisma.intakeEmployment.findUnique({
                where: { intakeId }
            }),
            prisma.intakeSection.findUnique({
                where: { intakeId_sectionName: { intakeId, sectionName: 'employment' } }
            })
        ]);

        if (!relational) {
            // Return empty defaults if no record exists yet
            return {
                success: true,
                data: {
                    employmentGoals: '',
                    educationGoals: '',
                    housingNeeds: '',
                    educationLevel: '',
                    employmentType: [],
                    desiredJobTitles: '',
                    targetPay: '',
                    workExperienceSummary: '',
                    transferableSkills: [],
                    transferableSkillsOther: '',
                    industryPreferences: [],
                    industryOther: '',
                    resumeComplete: false,
                    interviewSkills: false,
                    jobSearchAssistance: false,
                    transportationAssistance: false,
                    childcareAssistance: false,
                    housingAssistance: false,
                    placementDate: '',
                    companyName: '',
                    jobTitle: '',
                    wage: '',
                    hoursPerWeek: '',
                    supervisorName: '',
                    supervisorPhone: '',
                    probationEnds: '',
                    benefits: '',
                    transportationType: '',
                    commuteTime: '',
                    class1Date: '',
                    class2Date: '',
                    class3Date: '',
                    class4Date: '',
                    masterAppComplete: false,
                    jobSearchCommitmentCount: '',
                    jobSearchCommitments: [],
                    ispGoals: []
                } as any
            };
        }

        const data: VocationalData = {
            employmentGoals: relational.employmentGoals || '',
            educationGoals: relational.educationGoals || '',
            housingNeeds: relational.housingNeeds || '',
            educationLevel: relational.educationLevel || '',
            employmentType: relational.employmentType as any || [],
            desiredJobTitles: relational.desiredJobTitles || '',
            targetPay: relational.targetPay || '',
            workExperienceSummary: relational.workExperienceSummary || '',
            transferableSkills: relational.transferableSkills as any || [],
            transferableSkillsOther: relational.transferableSkillsOther || '',
            industryPreferences: relational.industryPreferences as any || [],
            industryOther: relational.industryOther || '',
            resumeComplete: relational.resumeComplete || false,
            interviewSkills: relational.interviewSkills || false,
            jobSearchAssistance: relational.jobSearchAssistance || false,
            transportationAssistance: relational.transportationAssistance || false,
            childcareAssistance: relational.childcareAssistance || false,
            housingAssistance: relational.housingAssistance || false,
            placementDate: relational.placementDate ? (typeof relational.placementDate === 'string' ? relational.placementDate : (relational.placementDate as Date).toISOString().split('T')[0]) : '',
            companyName: relational.companyName || '',
            jobTitle: relational.jobTitle || '',
            wage: relational.wage || '',
            hoursPerWeek: relational.hoursPerWeek || '',
            supervisorName: relational.supervisorName || '',
            supervisorPhone: relational.supervisorPhone || '',
            probationEnds: relational.probationEnds ? (typeof relational.probationEnds === 'string' ? relational.probationEnds : (relational.probationEnds as Date).toISOString().split('T')[0]) : '',
            benefits: relational.benefits || '',
            transportationType: relational.transportationType as any || '',
            commuteTime: relational.commuteTime || '',
            class1Date: relational.class1Date ? (typeof relational.class1Date === 'string' ? relational.class1Date : (relational.class1Date as Date).toISOString().split('T')[0]) : '',
            class2Date: relational.class2Date ? (typeof relational.class2Date === 'string' ? relational.class2Date : (relational.class2Date as Date).toISOString().split('T')[0]) : '',
            class3Date: relational.class3Date ? (typeof relational.class3Date === 'string' ? relational.class3Date : (relational.class3Date as Date).toISOString().split('T')[0]) : '',
            class4Date: relational.class4Date ? (typeof relational.class4Date === 'string' ? relational.class4Date : (relational.class4Date as Date).toISOString().split('T')[0]) : '',
            masterAppComplete: relational.masterAppComplete || false,
            jobSearchCommitmentCount: relational.jobSearchCommitmentCount || '',
            jobSearchCommitments: relational.jobSearchCommitments as any || [],
            ispGoals: relational.ispGoals as any || [],
            sectionStatus: (section?.status as any) || 'not_started'
        };

        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
