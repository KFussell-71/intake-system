import { prisma } from '@/lib/auth/authHelpersServer';

export class DocumentRepository {
    async create(data: {
        clientId: string;
        name: string;
        url: string;
        type: string;
        size?: number;
        uploadedById?: string;
    }) {
        return await prisma.document.create({
            data
        });
    }

    async getByClient(clientId: string) {
        return await prisma.document.findMany({
            where: { clientId },
            orderBy: { uploadedAt: 'desc' }
        });
    }

    async delete(id: string) {
        await prisma.document.delete({
            where: { id }
        });
    }
}

export const documentRepository = new DocumentRepository();
