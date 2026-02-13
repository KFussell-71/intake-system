'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateDORReport } from '@/app/actions/reports/generateDOR';
import { saveDORReport } from '@/app/actions/reports/saveDOR';
import { FileText, Loader2, Printer, Save, CheckCircle, Edit3, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';

interface ReportData {
    overview: string;
    goal: string;
    job_titles: string;
    pay: string;
    skills: string;
    barriers: string;
    support: string;
    readiness: string;
    conclusion: string;
}

export const DORReportButton = ({ intakeId, clientName }: { intakeId: string, clientName: string }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportData | null>(null);
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateDORReport(intakeId);
            if (result.success) {
                setReport(result.report);
                setOpen(true);
                setIsEditing(true); // Start in edit mode for review
                toast.success('DOR Report Generated');
            } else {
                toast.error('Failed to generate report');
            }
        } catch (e) {
            toast.error('Error generating report');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (status: 'draft' | 'final' = 'draft') => {
        if (!report) return;
        setLoading(true);
        try {
            const result = await saveDORReport(intakeId, report, status);
            if (result.success) {
                toast.success(status === 'final' ? 'Report Submitted' : 'Draft Saved');
                setIsEditing(false);
            } else {
                toast.error('Failed to save report');
            }
        } catch (e) {
            toast.error('Error saving report');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text("Participant Employment Services Intake Report", 105, 20, { align: "center" });

        // Metadata
        doc.setFontSize(12);
        doc.text(`Participant Name: ${clientName}`, 20, 40);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 50);
        doc.text("Prepared By: System Automated", 20, 60);

        // Content Sections
        let y = 80;
        const lineHeight = 7;

        const addSection = (title: string, content: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.text(title, 20, y);
            y += lineHeight;

            doc.setFont("helvetica", "normal");
            const splitText = doc.splitTextToSize(content || "N/A", 170);
            doc.text(splitText, 20, y);
            y += (splitText.length * lineHeight) + 10;
        };

        addSection("Overview", report.overview);
        addSection("Employment Goals", `30-Day Goal: ${report.goal}\nJob Titles: ${report.job_titles}\nTarget Pay: ${report.pay}`);
        addSection("Skills & Readiness", `Skills: ${report.skills}\nReadiness Score: ${report.readiness}/10`);
        addSection("Barriers & Support", `Barriers: ${report.barriers}\nSupport Needed: ${report.support}`);
        addSection("Conclusion", report.conclusion);

        doc.save(`DOR_Report_${clientName.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF Downloaded");
    };

    const updateField = (field: keyof ReportData, value: string) => {
        if (report) {
            setReport({ ...report, [field]: value });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={handleGenerate} variant="outline" disabled={loading} className="gap-2 w-full justify-start">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate DOR Report'}
            </Button>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>New Beginnings Outreach Report</span>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                                </Button>
                            ) : (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                    Preview
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
                                <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {report && (
                    <div className="space-y-6 p-1">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 md:col-span-2">
                                    <div className="space-y-2">
                                        <Label>Overview</Label>
                                        <Textarea value={report.overview} onChange={(e) => updateField('overview', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Conclusion (Narrative)</Label>
                                        <Textarea className="min-h-[150px]" value={report.conclusion} onChange={(e) => updateField('conclusion', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>30-Day Goal</Label>
                                    <Input value={report.goal} onChange={(e) => updateField('goal', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Titles</Label>
                                    <Input value={report.job_titles} onChange={(e) => updateField('job_titles', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Pay</Label>
                                    <Input value={report.pay} onChange={(e) => updateField('pay', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Readiness Score (1-10)</Label>
                                    <Input value={report.readiness} onChange={(e) => updateField('readiness', e.target.value)} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Skills & Experience</Label>
                                    <Textarea value={report.skills} onChange={(e) => updateField('skills', e.target.value)} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Barriers</Label>
                                    <Textarea value={report.barriers} onChange={(e) => updateField('barriers', e.target.value)} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Support Services Needed</Label>
                                    <Textarea value={report.support} onChange={(e) => updateField('support', e.target.value)} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-sm">
                                <section>
                                    <h3 className="font-bold border-b pb-1 mb-2">Overview</h3>
                                    <p>{report.overview}</p>
                                </section>
                                <section className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-bold border-b pb-1 mb-2">Employment Goals</h3>
                                        <p><strong>Goal:</strong> {report.goal}</p>
                                        <p><strong>Titles:</strong> {report.job_titles}</p>
                                        <p><strong>Pay:</strong> {report.pay}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold border-b pb-1 mb-2">Readiness</h3>
                                        <p><strong>Score:</strong> {report.readiness}/10</p>
                                        <p><strong>Skills:</strong> {report.skills}</p>
                                    </div>
                                </section>
                                <section>
                                    <h3 className="font-bold border-b pb-1 mb-2">Conclusion</h3>
                                    <p className="whitespace-pre-wrap leading-relaxed">{report.conclusion}</p>
                                </section>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => handleSave('draft')} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" /> Save Draft
                    </Button>
                    <Button onClick={() => handleSave('final')} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle className="w-4 h-4 mr-2" /> Submit Final
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
