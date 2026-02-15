"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgencyService, AgencySettings } from '@/services/AgencyService';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AgencyOnboarding = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<AgencySettings | null>(null);
    const [formData, setFormData] = useState({
        agency_name: '',
        contact_email: ''
    });

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setIsLoading(true);
        const data = await AgencyService.getSettings();
        if (data) {
            setSettings(data);
            // Check if it's the default name
            if (data.agency_name === 'New Agency' || data.agency_name === 'New Beginning Options') {
                setIsOpen(true);
                setFormData({
                    agency_name: '', // Clear for user input
                    contact_email: data.contact_email || ''
                });
            }
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!formData.agency_name.trim()) {
            toast.error("Agency Name is required");
            return;
        }

        setIsSaving(true);
        const { success, error } = await AgencyService.updateSettings({
            agency_name: formData.agency_name,
            contact_email: formData.contact_email
        });

        if (success) {
            toast.success("Welcome to your tailored workspace!");
            setIsOpen(false);
            // Ideally trigger a global refresh or context update here
            // reload to reflect changes in header?
            window.location.reload();
        } else {
            toast.error("Failed to save settings. Please try again.");
            console.error(error);
        }
        setIsSaving(false);
    };

    if (isLoading) return null; // Don't flash if loading

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to Your Agency OS</DialogTitle>
                    <DialogDescription>
                        Let's set up your workspace. This branding will appear on all reports and client documents.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Agency Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.agency_name}
                            onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. Hope Valley Outreach"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Admin Email
                        </Label>
                        <Input
                            id="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            className="col-span-3"
                            placeholder="director@example.org"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Get Started
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
