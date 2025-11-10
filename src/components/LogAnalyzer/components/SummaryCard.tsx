import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, AlertTriangle, Info, Layers } from 'lucide-react';
import type { LogStats } from '@/lib/wasm-parser';

interface SummaryCardProps {
    stats: LogStats;
    fileName?: string;
    fileSize?: number;
    summaryRef: React.RefObject<HTMLDivElement>;
}

/**
 * Display summary statistics for the analyzed log file
 * Shows total lines, errors, warnings, info, and unique errors as individual cards
 */
export function SummaryCard({ stats, fileName, fileSize, summaryRef }: SummaryCardProps) {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return (
        <div className="space-y-6">
            {/* File Info Badge */}
            {fileName && (
                <div className="flex items-center justify-end" ref={summaryRef} tabIndex={-1}>
                    <Badge
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-[#e5e7eb] dark:border-white/10 shadow-sm"
                    >
                        <FileText className="h-4 w-4 mr-2 text-[#1e40af] dark:text-blue-400" />
                        <span className="text-[#111827] dark:text-white font-mono">{fileName}</span>
                        {fileSize && (
                            <>
                                <span className="mx-2 text-[#e5e7eb] dark:text-neutral-700">•</span>
                                <span className="text-[#6b7280] dark:text-neutral-400">{formatFileSize(fileSize)}</span>
                            </>
                        )}
                    </Badge>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard
                    icon={Layers}
                    label="Total Lines"
                    value={stats.total_lines.toLocaleString()}
                    color="neutral"
                />
                <MetricCard
                    icon={AlertCircle}
                    label="Errors"
                    value={stats.total_errors.toLocaleString()}
                    color="red"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Warnings"
                    value={stats.total_warnings.toLocaleString()}
                    color="yellow"
                />
                <MetricCard
                    icon={Info}
                    label="Info"
                    value={stats.total_info.toLocaleString()}
                    color="blue"
                />
                <MetricCard
                    icon={AlertCircle}
                    label="Unique Errors"
                    value={stats.unique_errors.toString()}
                    color="purple"
                />
            </div>
        </div>
    );
}

// ============================================================================
// METRIC CARD SUB-COMPONENT
// ============================================================================

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: 'neutral' | 'red' | 'yellow' | 'blue' | 'purple';
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
    const colorStyles = {
        neutral: {
            bg: 'bg-neutral-50/80 dark:bg-neutral-800/40',
            border: 'border-[#e5e7eb] dark:border-neutral-700/50',
            icon: 'text-[#6b7280] dark:text-neutral-400',
            value: 'text-[#111827] dark:text-white',
            label: 'text-[#6b7280] dark:text-neutral-400',
        },
        red: {
            bg: 'bg-red-50/80 dark:bg-red-950/30',
            border: 'border-red-200/50 dark:border-red-800/30',
            icon: 'text-red-600 dark:text-red-400',
            value: 'text-red-700 dark:text-red-300',
            label: 'text-red-600/70 dark:text-red-400/70',
        },
        yellow: {
            bg: 'bg-yellow-50/80 dark:bg-yellow-950/30',
            border: 'border-yellow-200/50 dark:border-yellow-800/30',
            icon: 'text-yellow-600 dark:text-yellow-400',
            value: 'text-yellow-700 dark:text-yellow-300',
            label: 'text-yellow-600/70 dark:text-yellow-400/70',
        },
        blue: {
            bg: 'bg-blue-50/80 dark:bg-blue-950/30',
            border: 'border-blue-200/50 dark:border-blue-800/30',
            icon: 'text-blue-600 dark:text-blue-400',
            value: 'text-blue-700 dark:text-blue-300',
            label: 'text-blue-600/70 dark:text-blue-400/70',
        },
        purple: {
            bg: 'bg-purple-50/80 dark:bg-purple-950/30',
            border: 'border-purple-200/50 dark:border-purple-800/30',
            icon: 'text-purple-600 dark:text-purple-400',
            value: 'text-purple-700 dark:text-purple-300',
            label: 'text-purple-600/70 dark:text-purple-400/70',
        },
    };

    const styles = colorStyles[color];

    return (
        <Card className={`${styles.bg} ${styles.border} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200`}>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${styles.icon}`} />
                </div>
                <div className="space-y-1">
                    <p className={`font-mono text-2xl font-bold tracking-tight ${styles.value}`}>
                        {value}
                    </p>
                    <p className={`text-xs font-medium tracking-wide uppercase ${styles.label}`}>
                        {label}
                    </p>
                </div>
            </div>
        </Card>
    );
}
