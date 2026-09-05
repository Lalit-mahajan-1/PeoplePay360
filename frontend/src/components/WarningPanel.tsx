import React from 'react';
import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from 'lucide-react';

export interface PayrollWarning {
    id?: string;
    severity: 'INFO' | 'WARNING' | 'ERROR';
    code: string;
    message: string;
    isResolved?: boolean;
    createdAt?: string;
}

interface WarningPanelProps {
    warnings: PayrollWarning[];
    onResolve?: (warningId: string) => void;
    title?: string;
}

const SEVERITY_CONFIG = {
    ERROR: {
        bg: 'bg-red-50/80 border-red-200 text-red-900',
        badge: 'bg-red-600 text-white',
        icon: AlertOctagon,
        iconColor: 'text-red-600',
        label: 'ERROR',
    },
    WARNING: {
        bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
        badge: 'bg-amber-500 text-white',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        label: 'WARNING',
    },
    INFO: {
        bg: 'bg-blue-50/80 border-blue-200 text-blue-900',
        badge: 'bg-blue-600 text-white',
        icon: Info,
        iconColor: 'text-blue-600',
        label: 'INFO',
    },
};

export default function WarningPanel({ warnings, onResolve, title = 'Payroll Audit Warnings' }: WarningPanelProps) {
    if (!warnings || warnings.length === 0) {
        return (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium">No warnings or calculation anomalies detected for this period.</span>
            </div>
        );
    }

    // Sort by severity: ERROR first, WARNING second, INFO last
    const severityOrder = { ERROR: 0, WARNING: 1, INFO: 2 };
    const sorted = [...warnings].sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    const errorCount = warnings.filter((w) => w.severity === 'ERROR' && !w.isResolved).length;
    const warningCount = warnings.filter((w) => w.severity === 'WARNING' && !w.isResolved).length;
    const infoCount = warnings.filter((w) => w.severity === 'INFO' && !w.isResolved).length;

    return (
        <div className="space-y-4">
            {/* Header & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold">
                    {errorCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                            {errorCount} Error{errorCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200">
                            {warningCount} Warning{warningCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {infoCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                            {infoCount} Info
                        </span>
                    )}
                </div>
            </div>

            {/* Blocking Error Alert Banner */}
            {errorCount > 0 && (
                <div className="p-4 rounded-xl bg-red-600 text-white shadow-md flex items-start gap-3">
                    <AlertOctagon className="w-6 h-6 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                        <h4 className="font-bold text-sm">Validation Blocked by Critical Errors</h4>
                        <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                            There are {errorCount} unresolved error warning(s). Payrun validation is disabled until contract, checkout, or employee configuration errors are resolved.
                        </p>
                    </div>
                </div>
            )}

            {/* List of Warning Items */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {sorted.map((item, idx) => {
                    const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.INFO;
                    const Icon = cfg.icon;

                    return (
                        <div
                            key={item.id || idx}
                            className={`p-3.5 rounded-xl border transition-all ${cfg.bg} ${
                                item.isResolved ? 'opacity-60 bg-gray-50 border-gray-200' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-black/5 text-gray-700 font-mono text-[11px] font-bold">
                                            {item.code}
                                        </span>
                                        {item.isResolved && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                RESOLVED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium leading-snug">{item.message}</p>
                                </div>
                                {onResolve && !item.isResolved && item.id && (
                                    <button
                                        onClick={() => onResolve(item.id!)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition shrink-0 cursor-pointer"
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
