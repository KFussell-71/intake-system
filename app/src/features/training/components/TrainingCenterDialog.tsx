import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Assuming these exist or using basic if not
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming standard Shadcn-like tabs
import { Button } from '@/components/ui/button';
import { HelpCircle, BookOpen, MessageCircle, ChevronRight, PlayCircle } from 'lucide-react';
import { TRAINING_CONTENT } from '@/config/training_content';

export const TrainingCenterDialog: React.FC = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800">
                    <HelpCircle className="w-4 h-4" />
                    Interactive Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Supervisor Training Center</DialogTitle>
                            <p className="text-slate-500 text-sm mt-1">Master the tools and workflows of the Command Center.</p>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="guides" className="mt-6">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="guides" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <PlayCircle className="w-4 h-4" /> Feature Tours
                        </TabsTrigger>
                        <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <MessageCircle className="w-4 h-4" /> Frequently Asked Questions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="guides" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TRAINING_CONTENT.guides.map((guide, idx) => (
                                <div key={guide.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow bg-white group cursor-pointer group">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs text-slate-500 font-mono">
                                            {idx + 1}
                                        </span>
                                        {guide.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm mb-4 min-h-[40px]">{guide.description}</p>

                                    {guide.videoUrl && (
                                        <div className="mb-4 p-3 bg-slate-900 rounded-lg flex items-center justify-between group/video overflow-hidden relative">
                                            <div className="flex items-center gap-2 text-white">
                                                <PlayCircle className="w-5 h-5 text-indigo-400 group-hover/video:scale-110 transition-transform" />
                                                <span className="text-xs font-semibold">Watch Training Video</span>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-400 hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); window.open(guide.videoUrl, '_blank'); }}>
                                                Launch Player
                                            </Button>
                                            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                    )}

                                    <div className="space-y-2 pl-2 border-l-2 border-indigo-100">
                                        {guide.steps.map((step, sIdx) => (
                                            <div key={sIdx} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="faq">
                        <div className="space-y-4">
                            {TRAINING_CONTENT.faq.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                                        <HelpCircle className="w-4 h-4 text-indigo-500" />
                                        {item.question}
                                    </h4>
                                    <p className="text-slate-600 text-sm pl-6 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
