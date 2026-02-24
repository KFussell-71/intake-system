'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getTeamMembers, updateTeamMemberRole } from '@/actions/team-actions';
import { InviteMemberDialog } from './InviteMemberDialog';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { Users, MoreHorizontal, ShieldCheck, UserCog, Briefcase, FileText } from 'lucide-react';
import { dashboardRepository } from '@/repositories/DashboardRepository';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TeamManagementWidget() {
    const [members, setMembers] = useState<Profile[]>([]);
    const [workloads, setWorkloads] = useState<Record<string, { active: number, pending: number }>>({});
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        try {
            const [memberData, workloadData] = await Promise.all([
                getTeamMembers(),
                dashboardRepository.getStaffWorkload()
            ]);

            setMembers(memberData);

            // Map workload data to access by user id
            const workloadMap: Record<string, { active: number, pending: number }> = {};
            workloadData.forEach((w: any) => {
                workloadMap[w.staff_id] = {
                    active: w.active_count || 0,
                    pending: w.pending_count || 0
                };
            });
            setWorkloads(workloadMap);
        } catch (error) {
            console.error('Failed to fetch members or workload', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleRoleUpdate = async (userId: string, newRole: Profile['role']) => {
        const promise = updateTeamMemberRole(userId, newRole);
        toast.promise(promise, {
            loading: 'Updating role...',
            success: () => {
                fetchMembers(); // Refresh list
                return 'Role updated successfully';
            },
            error: 'Failed to update role'
        });
    };

    const getRoleBadgeColor = (role: Profile['role']) => {
        switch (role) {
            case 'admin': return 'destructive';
            case 'supervisor': return 'default'; // primary/black
            case 'specialist': return 'secondary';
            case 'intake_worker': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <Card className="col-span-12 xl:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Team Roster
                    </CardTitle>
                    <CardDescription>
                        Manage access levels and invite new specialists.
                    </CardDescription>
                </div>
                <InviteMemberDialog onSuccess={fetchMembers} />
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Active Clients</TableHead>
                                <TableHead>Pending Intakes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No team members found. Invite someone to get started.
                                    </TableCell>
                                </TableRow>
                            ) : members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>
                                                    {member.full_name?.substring(0, 2).toUpperCase() || member.email?.substring(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {member.full_name || 'Unnamed User'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {member.email || 'No Email'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeColor(member.role)}>
                                            {member.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <span className="font-mono font-bold text-indigo-700">
                                                {workloads[member.id]?.active || 0}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <span className="font-mono font-bold text-orange-600">
                                                {workloads[member.id]?.pending || 0}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'intake_worker')}>
                                                    Intake Worker
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'specialist')}>
                                                    Specialist
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'supervisor')}>
                                                    Supervisor
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, 'admin')} className="text-red-600">
                                                    Make Admin
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
