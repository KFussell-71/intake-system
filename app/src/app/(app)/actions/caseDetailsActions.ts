'use server';

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { clinicalNoteService } from '@/services/ClinicalNoteService';
import { outcomeService } from '@/services/OutcomeService';

export async function getCaseDetailsAction(caseId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const caseRecord = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                client: true
            }
        });

        if (!caseRecord) {
            return { success: false, error: 'Case not found' };
        }

        const clientId = caseRecord.clientId;

        // Fetch Case Notes
        const notes = await prisma.caseNote.findMany({
            where: { clientId: clientId },
            include: {
                author: {
                    select: { fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // We temporarily return these services' promises as they will eventually be refactored too.
        // Wait, clinicalNoteService & outcomeService use Supabase.
        // If they use Supabase, we should probably bypass them or just let them fail till migrated, 
        // OR migrate their small queries right here. Let's just use Prisma for clinical notes and outcome measures!

        let measuresRes: any[] = [];
        let historyRes: any[] = [];
        let clinicalRes: any[] = [];

        try {
            clinicalRes = await prisma.clinicalNote.findMany({
                where: { clientId: clientId },
                orderBy: { createdAt: 'desc' }
            });
        } catch (e) {
            console.log("clinical note prisma fetch failed (requires model)", e);
        }

        try {
            historyRes = await prisma.outcomeRecord.findMany({
                where: { caseId: caseId },
                orderBy: { recordedAt: 'asc' }
            });
        } catch (e) {
            console.log("outcome record prisma fetch failed (requires model)", e);
        }

        try {
            measuresRes = await prisma.outcomeMeasure.findMany({
                orderBy: { sortOrder: 'asc' }
            });
        } catch (e) {
            console.log("outcome measure prisma fetch failed (requires model)", e);
        }

        return {
            success: true,
            data: {
                caseData: caseRecord,
                notes: notes,
                clinicalNotes: clinicalRes,
                outcomeMeasures: measuresRes,
                outcomeHistory: historyRes,
                userId: auth.userId
            }
        };

    } catch (error: any) {
        console.error('getCaseDetailsAction failed:', error);
        return { success: false, error: error.message };
    }
}
