import { BaseRepository } from './BaseRepository';
import { DashboardStats, IntakeTrend, StaffWorkload, MyWorkload, ActivityFeedItem } from '@/types/dashboard';

/**
 * Dashboard Repository (Refactored to Prisma)
 * 
 * Migrated from Supabase RPCs to high-performance Prisma queries.
 */
export class DashboardRepository extends BaseRepository {

    async getMyWorkload(userId: string): Promise<MyWorkload | null> {
        const [activeClients, intakesInProgress, upcomingAppointments] = await Promise.all([
            this.db.client.count({
                where: { assignedToId: userId, status: 'active' }
            }),
            this.db.intake.count({
                where: {
                    client: { assignedToId: userId },
                    status: 'draft'
                }
            }),
            this.db.appointment.count({
                where: {
                    staffId: userId,
                    startTime: { gte: new Date() },
                    status: 'scheduled'
                }
            })
        ]);

        return {
            active_clients: activeClients,
            intakes_in_progress: intakesInProgress,
            upcoming_appointments: upcomingAppointments
        };
    }

    async getRecentActivity(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
        const logs = await this.db.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        // Map AuditLog to ActivityFeedItem
        return logs.map(log => ({
            id: log.id,
            action: log.action,
            resource_type: log.resourceType,
            resource_id: log.resourceId || '',
            message: `${log.action} on ${log.resourceType}`,
            created_at: log.createdAt.toISOString(),
            metadata: log.metadata as any
        }));
    }

    async getDashboardStats(userId: string): Promise<DashboardStats> {
        const [myWorkload, recentActivity, intakeTrends, staffWorkload] = await Promise.all([
            this.getMyWorkload(userId),
            this.getRecentActivity(userId, 5),
            this.getIntakeTrends(),
            this.getStaffWorkload()
        ]);

        return {
            myWorkload,
            recentActivity,
            intakeTrends,
            staffWorkload
        };
    }

    async getIntakeTrends(days: number = 30): Promise<IntakeTrend[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const intakes = await this.db.intake.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true }
        });

        // Group by date
        const trends: Record<string, number> = {};
        intakes.forEach(i => {
            const date = i.createdAt.toISOString().split('T')[0];
            trends[date] = (trends[date] || 0) + 1;
        });

        return Object.entries(trends).map(([date, count]) => ({
            date,
            count
        })).sort((a, b) => a.date.localeCompare(b.date));
    }

    async getStaffWorkload(): Promise<StaffWorkload[]> {
        const staff = await this.db.profile.findMany({
            where: { role: { in: ['staff', 'supervisor'] } },
            include: {
                _count: {
                    select: {
                        clientsAssigned: { where: { status: 'active' } },
                        intakesUpdated: { where: { status: 'draft' } }
                    }
                }
            }
        });

        return staff.map(s => ({
            staff_id: s.id,
            staff_name: s.fullName || s.username,
            active_clients: s._count.clientsAssigned,
            intakes_in_progress: s._count.intakesUpdated
        }));
    }

    async getMonthlyIntakes(): Promise<{ name: string; intakes: number }[]> {
        const intakes = await this.db.intake.findMany({
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        const stats: Record<string, number> = {};
        intakes.forEach(i => {
            const month = new Date(i.createdAt).toLocaleString('default', { month: 'short' });
            stats[month] = (stats[month] || 0) + 1;
        });

        return Object.entries(stats).map(([name, intakes]) => ({ name, intakes }));
    }
}

export const dashboardRepository = new DashboardRepository();
