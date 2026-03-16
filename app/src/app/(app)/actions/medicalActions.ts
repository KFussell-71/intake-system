"use server";

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';
import { MedicalData } from '@/features/intake/intakeTypes';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';

/**
 * Server Action: Saves Medical, Mental Health, and Substance Use data using Prisma.
 * Following the Catalog guide, clinical data is stored in the Intake JSONB 'data' field.
 */
export async function saveMedicalAction(intakeId: string, data: Partial<MedicalData>) {
    const { authenticated, userId } = await verifyAuthentication();
    if (!authenticated || !userId) {
        return { success: false, error: 'Unauthorized' };
    }

    // 0. Validation
    const validation = validateSection('medical', data);
    if (!validation.success) {
        return { success: false, error: `Validation Failed: ${validation.error}` };
    }

    try {
        // Perform transactional update to ensure audit events and status are synced
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Fetch current intake to preserve existing JSONB data
            const intake = await tx.intake.findUnique({
                where: { id: intakeId },
                select: { data: true }
            });

            if (!intake) throw new Error('Intake not found');

            // 2. Merge medical data into the JSONB blob
            const currentData = (intake.data as any) || {};
            const updatedData = {
                ...currentData,
                medical: {
                    ...(currentData.medical || {}),
                    ...data
                }
            };

            // 3. Update Intake record
            await tx.intake.update({
                where: { id: intakeId },
                data: {
                    data: updatedData,
                    updatedById: userId,
                    updatedAt: new Date()
                }
            });

            // 4. Audit Log (Event Sourcing)
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'field_update',
                    fieldPath: 'medical_domain',
                    newValue: JSON.stringify(data),
                    changedBy: userId
                }
            });

            // 5. Update Section Status
            const status = data.sectionStatus || 'in_progress';
            await tx.intakeSection.upsert({
                where: {
                    intakeId_sectionName: {
                        intakeId,
                        sectionName: 'medical'
                    }
                },
                update: {
                    status: status,
                    lastUpdatedBy: userId,
                    updatedAt: new Date()
                },
                create: {
                    intakeId,
                    sectionName: 'medical',
                    status: status,
                    lastUpdatedBy: userId
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath(`/modernized-intake/${intakeId}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error saving medical data:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Server Action: Get Medical, Mental Health, and Substance Use data using Prisma.
 */
export async function getMedicalAction(intakeId: string): Promise<{ success: boolean; data?: MedicalData; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    try {
        const [intake, section] = await Promise.all([
            prisma.intake.findUnique({
                where: { id: intakeId },
                select: { data: true }
            }),
            prisma.intakeSection.findUnique({
                where: { intakeId_sectionName: { intakeId, sectionName: 'medical' } }
            })
        ]);

        if (!intake) return { success: false, error: 'Intake not found' };

        const currentData = (intake.data as any) || {};
        const medical = currentData.medical || {};

        const data: MedicalData = {
            consentToRelease: medical.consentToRelease ?? false,
            medicalEvalNeeded: medical.medicalEvalNeeded ?? false,
            psychEvalNeeded: medical.psychEvalNeeded ?? false,
            medicalConditionCurrent: medical.medicalConditionCurrent ?? false,
            medicalConditionDescription: medical.medicalConditionDescription || '',
            medicalPriorHistory: medical.medicalPriorHistory || '',
            medicalMedsCurrent: medical.medicalMedsCurrent ?? false,
            medicalMedsDetails: medical.medicalMedsDetails || '',
            primaryCarePhysician: medical.primaryCarePhysician || '',
            primaryCarePhysicianContact: medical.primaryCarePhysicianContact || '',
            medicalComments: medical.medicalComments || '',
            medicalEmploymentImpact: medical.medicalEmploymentImpact || '',
            mhHistory: medical.mhHistory ?? false,
            mhHistoryDetails: medical.mhHistoryDetails || '',
            mhPriorCounseling: medical.mhPriorCounseling ?? false,
            mhPriorCounselingDetails: medical.mhPriorCounselingDetails || '',
            mhPriorCounselingDates: medical.mhPriorCounselingDates || '',
            mhPriorDiagnosis: medical.mhPriorDiagnosis ?? false,
            mhPriorDiagnosisDetails: medical.mhPriorDiagnosisDetails || '',
            mhPriorHelpfulActivities: medical.mhPriorHelpfulActivities || '',
            mhPriorMeds: medical.mhPriorMeds ?? false,
            mhPriorMedsDetails: medical.mhPriorMedsDetails || '',
            tobaccoUse: medical.tobaccoUse ?? false,
            tobaccoDuration: medical.tobaccoDuration || '',
            tobaccoQuitInterest: medical.tobaccoQuitInterest || '',
            tobaccoProducts: medical.tobaccoProducts || [],
            tobaccoOther: medical.tobaccoOther || '',
            alcoholHistory: medical.alcoholHistory ?? false,
            alcoholCurrent: medical.alcoholCurrent ?? false,
            alcoholFrequency: medical.alcoholFrequency || '',
            alcoholQuitInterest: medical.alcoholQuitInterest || '',
            alcoholProducts: medical.alcoholProducts || [],
            alcoholOther: medical.alcoholOther || '',
            alcoholPriorTx: medical.alcoholPriorTx ?? false,
            alcoholPriorTxDetails: medical.alcoholPriorTxDetails || '',
            alcoholPriorTxDuration: medical.alcoholPriorTxDuration || '',
            drugHistory: medical.drugHistory ?? false,
            drugCurrent: medical.drugCurrent ?? false,
            drugFrequency: medical.drugFrequency || '',
            drugQuitInterest: medical.drugQuitInterest || '',
            drugProducts: medical.drugProducts || [],
            drugOther: medical.drugOther || '',
            drugPriorTx: medical.drugPriorTx ?? false,
            drugPriorTxDetails: medical.drugPriorTxDetails || '',
            substanceComments: medical.substanceComments || '',
            substanceEmploymentImpact: medical.substanceEmploymentImpact || '',
            primaryDiagnosisCode: medical.primaryDiagnosisCode || '',
            mobilityStatus: medical.mobilityStatus || 'independent',
            sectionStatus: (section?.status as any) || 'not_started'
        };

        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
