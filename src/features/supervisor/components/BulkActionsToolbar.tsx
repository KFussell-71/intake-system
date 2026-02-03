'use client';

import React from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    totalCount: number;
    allSelected: boolean;
    onSelectAll: (selected: boolean) => void;
    onBulkApprove: () => void;
    onBulkExport: () => void;
    isProcessing?: boolean;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
    selectedCount,
    totalCount,
    allSelected,
    onSelectAll,
    onBulkApprove,
    onBulkExport,
    isProcessing = false
}) => {
    return (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left Side - Selection Controls */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                className="w-4 h-4 text-primary focus:ring-primary rounded border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                Select All
                            </span>
                        </label>

                        {selectedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-px bg-slate-300" />
                                <span className="text-sm font-semibold text-primary">
                                    {selectedCount} selected
                                </span>
                                <span className="text-xs text-slate-500">
                                    of {totalCount}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Bulk Actions */}
                    <div className="flex items-center gap-2">
                        {selectedCount > 0 ? (
                            <>
                                <ActionButton
                                    onClick={onBulkExport}
                                    disabled={isProcessing}
                                    size="sm"
                                    icon={<Download className="w-4 h-4" />}
                                >
                                    Export Selected ({selectedCount})
                                </ActionButton>

                                <ActionButton
                                    onClick={onBulkApprove}
                                    disabled={isProcessing}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    icon={
                                        isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )
                                    }
                                >
                                    {isProcessing ? 'Approving...' : `Approve Selected (${selectedCount})`}
                                </ActionButton>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500 italic">
                                Select reports to enable bulk actions
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress Indicator */}
                {isProcessing && (
                    <div className="mt-3">
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Processing bulk operation...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
