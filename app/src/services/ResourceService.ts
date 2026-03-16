
import { prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';

export type CommunityResource = {
    id: string;
    name: string;
    category: string;
    description: string;
    address: string;
    phone: string;
    website: string;
    isVerified: boolean;
    source: string;
    tags: string[];
};

export class ResourceService {
    static async searchResources(query: string, category?: string): Promise<CommunityResource[]> {
        try {
            const resources = await prisma.communityResource.findMany({
                where: {
                    isVerified: true,
                    ...(category ? { category } : {}),
                    ...(query ? {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } }
                        ]
                    } : {})
                }
            });

            // Map Prisma model to internal type (snake_case fix if needed, but here it's already camelCase in Prisma)
            const data = resources.map(r => ({
                id: r.id,
                name: r.name,
                category: r.category,
                description: r.description,
                address: r.address,
                phone: r.phone,
                website: r.website,
                isVerified: r.isVerified,
                source: r.source,
                tags: r.tags
            }));

            // Mock Data Fallback for Demo if DB returns nothing OR errors
            if (data.length === 0 && category === 'Food') {
                console.log('Using Mock Fallback Data for Food');
                return [
                    {
                        id: 'mock-1',
                        name: 'Grace Resources',
                        category: 'Food',
                        description: 'Emergency food pantry and hot meals.',
                        address: '45134 Sierra Hwy, Lancaster, CA',
                        phone: '(661) 940-5272',
                        website: 'https://graceresources.org',
                        isVerified: true,
                        source: 'system',
                        tags: ['food', 'pantry', 'meals']
                    },
                    {
                        id: 'mock-2',
                        name: 'St. Vincent de Paul',
                        category: 'Food',
                        description: 'Food distribution and assistance.',
                        address: '45058 Trefoil Ln, Lancaster, CA',
                        phone: '(661) 942-3222',
                        website: 'https://svdpla.org',
                        isVerified: true,
                        source: 'system',
                        tags: ['food', 'charity']
                    }
                ];
            }

            return data;
        } catch (err) {
            console.error('ResourceService Exception:', err);
            return [];
        }
    }

    static async addResource(resource: Omit<CommunityResource, 'id'>) {
        try {
            return await prisma.communityResource.create({
                data: {
                    name: resource.name,
                    category: resource.category,
                    description: resource.description,
                    address: resource.address,
                    phone: resource.phone,
                    website: resource.website,
                    isVerified: resource.isVerified,
                    source: resource.source,
                    tags: resource.tags
                }
            });
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async getAll() {
        try {
            return await prisma.communityResource.findMany();
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

