'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inviteTeamMember } from '@/actions/team-actions';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

interface InviteMemberDialogProps {
    onSuccess?: () => void;
}

export function InviteMemberDialog({ onSuccess }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'specialist' as 'admin' | 'supervisor' | 'specialist' | 'intake_worker'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await inviteTeamMember({
                email: formData.email,
                fullName: formData.fullName,
                role: formData.role
            });

            if (result.success) {
                toast.success('Invitation sent successfully');
                setOpen(false);
                setFormData({ email: '', fullName: '', role: 'specialist' });
                onSuccess?.();
            } else {
                toast.error(result.error || 'Failed to send invitation');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Mail className="w-4 h-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite New Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="colleague@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            required
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="intake_worker">Intake Worker</SelectItem>
                                <SelectItem value="specialist">Specialist</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {formData.role === 'intake_worker' && 'Can create and view their own intakes.'}
                            {formData.role === 'specialist' && 'Can view assigned cases and add notes.'}
                            {formData.role === 'supervisor' && 'Can manage team, approve reports, and view all cases.'}
                            {formData.role === 'admin' && 'Full system access.'}
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
