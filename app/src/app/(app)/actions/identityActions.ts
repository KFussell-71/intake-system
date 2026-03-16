"use server";

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';
import { IdentityData } from '@/features/intake/intakeTypes';

/**
 * Server Action: Save Identity using Prisma.
 */
export async function saveIdentityAction(intakeId: string, data: Partial<IdentityData>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        // 1. Fetch Intake to get Client ID
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            select: { clientId: true }
        });

        if (!intake) throw new Error('Intake not found');

        // 2. Perform transactional update
        await prisma.$transaction(async (tx: any) => {
            // A. Relational Write (The Source of Truth)
            const relationalPayload: any = {
                intakeId: intakeId,
                clientId: intake.clientId
            };

            if (data.clientName) {
                const parts = data.clientName.trim().split(/\s+/);
                relationalPayload.firstName = parts[0];
                relationalPayload.lastName = parts.slice(1).join(' ');
            }
            if (data.ssnLastFour !== undefined) relationalPayload.ssnLastFour = data.ssnLastFour;
            if (data.phone !== undefined) relationalPayload.phone = data.phone;
            if (data.email !== undefined) relationalPayload.email = data.email;
            if (data.address !== undefined) relationalPayload.address = data.address;
            if (data.birthDate !== undefined) relationalPayload.dateOfBirth = data.birthDate;
            if (data.gender !== undefined) relationalPayload.gender = data.gender;
            if (data.race !== undefined) relationalPayload.race = data.race;

            await tx.intakeIdentity.upsert({
                where: { intakeId: intakeId },
                update: relationalPayload,
                create: relationalPayload
            });

            // B. Audit Log (Event Sourcing) - Simplified version
            const changes = Object.keys(data).filter(k => k !== 'sectionStatus');
            if (changes.length > 0) {
                await tx.intakeEvent.create({
                    data: {
                        intakeId,
                        eventType: 'field_update',
                        fieldPath: 'identity.bulk',
                        newValue: `Updated ${changes.join(', ')}`,
                        changedBy: auth.userId
                    }
                });
            }

            // C. Update Section Status
            if (data.sectionStatus) {
                await tx.intakeSection.upsert({
                    where: {
                        intakeId_sectionName: {
                            intakeId,
                            sectionName: 'identity'
                        }
                    },
                    update: {
                        status: data.sectionStatus,
                        lastUpdatedBy: auth.userId
                    },
                    create: {
                        intakeId,
                        sectionName: 'identity',
                        status: data.sectionStatus,
                        lastUpdatedBy: auth.userId
                    }
                });
            }
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };

    } catch (err: any) {
        console.error('saveIdentityAction Error', err);
        return { success: false, error: err.message };
    }
}
/**
 * Server Action: Get Identity Data using Prisma.
 */
export async function getIdentityAction(intakeId: string): Promise<{ success: boolean; data?: IdentityData; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    try {
        const [intake, relational, section] = await Promise.all([
            prisma.intake.findUnique({
                where: { id: intakeId },
                include: { client: true }
            }),
            prisma.intakeIdentity.findUnique({
                where: { intakeId }
            }),
            prisma.intakeSection.findUnique({
                where: {
                    intakeId_sectionName: { intakeId, sectionName: 'identity' }
                }
            })
        ]);

        if (!intake) return { success: false, error: 'Intake not found' };

        const client = intake.client;
        const jsonData = intake.data as any || {};

        const birthDateValue = relational?.dateOfBirth;
        const birthDate = birthDateValue ? (typeof birthDateValue === 'string' ? birthDateValue : birthDateValue.toISOString().split('T')[0]) : jsonData.birthDate || '';

        const data: IdentityData = {
            clientName: (relational?.firstName ? `${relational.firstName} ${relational.lastName}` : null) || client?.name || jsonData.clientName || '',
            ssnLastFour: relational?.ssnLastFour || jsonData.ssnLastFour || '',
            phone: relational?.phone || client?.phone || jsonData.phone || '',
            email: relational?.email || client?.email || jsonData.email || '',
            address: relational?.address || client?.address || jsonData.address || '',
            birthDate: birthDate,
            gender: relational?.gender || jsonData.gender || '',
            race: relational?.race || jsonData.race || '',
            reportDate: intake.reportDate ? intake.reportDate.toISOString().split('T')[0] : '',
            completionDate: intake.completionDate ? intake.completionDate.toISOString().split('T')[0] : '',
            sectionStatus: (section?.status as any) || 'not_started',
            relationshipStatus: jsonData.relationshipStatus || '',
            preferredContactMethods: jsonData.preferredContactMethods || [],
            employmentStatus: jsonData.employmentStatus || '',
            emergencyContactName: jsonData.emergencyContactName || '',
            emergencyContactPhone: jsonData.emergencyContactPhone || '',
            emergencyContactRelation: jsonData.emergencyContactRelation || '',
            referralSource: relational?.referralSource || jsonData.referralSource || '',
            referralContact: relational?.referralContact || jsonData.referralContact || ''
        };

        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
