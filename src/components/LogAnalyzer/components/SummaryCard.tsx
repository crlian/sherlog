import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { LogStats } from '@/lib/wasm-parser';

interface SummaryCardProps {
    stats: LogStats;
    fileName?: string;
    fileSize?: number;
    summaryRef: React.RefObject<HTMLDivElement>;
}

/**
 * Display summary statistics for the analyzed log file
 * Shows total lines, errors, warnings, info, and unique errors
 */
export function SummaryCard({ stats, fileName, fileSize, summaryRef }: SummaryCardProps) {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card className="bg-white dark:bg-neutral-900/60 border-[#e5e7eb] dark:border-white/10 shadow-md ring-1 ring-black/[0.08] dark:ring-0">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle
                            ref={summaryRef}
                            tabIndex={-1}
                            className="text-[#111827] dark:text-white outline-none text-lg font-semibold"
                        >
                            Summary
                        </CardTitle>
                        <CardDescription className="text-[#6b7280] mt-1.5">
                            {stats.total_lines.toLocaleString()} log entries analyzed
                        </CardDescription>
                    </div>
                    {fileName && (
                        <div className="text-right">
                            <p className="text-sm font-medium text-[#111827] dark:text-white truncate max-w-[200px]">
                                {fileName}
                            </p>
                            {fileSize && (
                                <p className="text-xs text-[#6b7280] dark:text-neutral-500 mt-0.5">
                                    {formatFileSize(fileSize)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <StatItem
                        label="Total Lines"
                        value={stats.total_lines.toLocaleString()}
                        className="text-[#6b7280] dark:text-neutral-400"
                    />
                    <StatItem
                        label="Errors"
                        value={stats.total_errors.toLocaleString()}
                        className="text-red-600 dark:text-red-400"
                    />
                    <StatItem
                        label="Warnings"
                        value={stats.total_warnings.toLocaleString()}
                        className="text-yellow-600 dark:text-yellow-400"
                    />
                    <StatItem
                        label="Info"
                        value={stats.total_info.toLocaleString()}
                        className="text-[#1e40af] dark:text-blue-400"
                    />
                    <StatItem
                        label="Unique Errors"
                        value={stats.unique_errors.toString()}
                        className="text-purple-600 dark:text-purple-400"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// STAT ITEM SUB-COMPONENT
// ============================================================================

interface StatItemProps {
    label: string;
    value: string;
    className?: string;
}

function StatItem({ label, value, className }: StatItemProps) {
    return (
        <div className="space-y-2">
            <p className="text-[#6b7280] dark:text-neutral-400 text-xs font-medium tracking-wide uppercase">
                {label}
            </p>
            <p className={`font-semibold text-2xl font-mono ${className}`}>
                {value}
            </p>
        </div>
    );
}
