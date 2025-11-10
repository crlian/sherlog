import { useState, useMemo } from 'react';
import { XCircle, TriangleAlert, Info, Eye, TrendingUp, ChevronRight, ChevronDown, FileText, Clock, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    type ParsedError,
    getSeverityColor,
    getTypeColor,
    formatOccurrences,
    formatLocation,
} from '@/lib/wasm-parser';

interface ErrorTableProps {
    errors: ParsedError[];
    onViewDetails: (error: ParsedError) => void;
}

/**
 * Display errors in a sortable table with expandable rows
 * Shows error type, severity, message, occurrences, and expandable details
 */
export function ErrorTable({ errors, onViewDetails }: ErrorTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Memoize enriched errors to avoid recalculating colors on every render
    const enrichedErrors = useMemo(() =>
        errors.map((error, index) => ({
            ...error,
            index: index + 1,
            typeColor: getTypeColor(error.type),
            severityColor: getSeverityColor(error.severity),
        })),
        [errors]
    );

    const toggleRow = (errorId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(errorId)) {
                newSet.delete(errorId);
            } else {
                newSet.add(errorId);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (errors.length === 0) {
        return null;
    }

    return (
        <Card className="bg-white dark:bg-neutral-900/60 border-[#e5e7eb] dark:border-white/10 shadow-md ring-1 ring-black/[0.08] dark:ring-0">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[#111827] dark:text-white text-lg font-semibold">
                        Issues
                    </CardTitle>
                    <p className="text-sm text-[#6b7280] dark:text-neutral-400">
                        Sorted by frequency
                    </p>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Table>
                    <caption className="sr-only">
                        List of {errors.length} errors sorted by occurrence frequency
                    </caption>
                    <TableHeader>
                        <TableRow className="border-[#e5e7eb] dark:border-white/10 hover:bg-transparent">
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[40px]"></TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[60px]">#</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px]">Type</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px]">Severity</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium">Message</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[120px] text-right">Occurrences</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px] text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrichedErrors.map((error) => {
                            const isExpanded = expandedRows.has(error.id);
                            return (
                                <Collapsible
                                    key={error.id}
                                    open={isExpanded}
                                    onOpenChange={() => toggleRow(error.id)}
                                    asChild
                                >
                                    <>
                                        {/* Main Row */}
                                        <TableRow
                                            className="border-[#e5e7eb] dark:border-white/5 hover:bg-[#f9fafb] dark:hover:bg-white/5 transition-colors"
                                        >
                                            <TableCell>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-transparent"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-[#6b7280] dark:text-neutral-400" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-[#6b7280] dark:text-neutral-400" />
                                                        )}
                                                        <span className="sr-only">
                                                            {isExpanded ? 'Collapse' : 'Expand'} error details
                                                        </span>
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </TableCell>
                                            <TableCell className="font-mono text-[#9ca3af] dark:text-neutral-500 text-sm">
                                                #{error.index}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={error.typeColor}>
                                                    {getErrorTypeIcon(error.type)}
                                                    {error.type.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={error.severityColor}>
                                                    {getSeverityIconComponent(error.severity)}
                                                    {error.severity.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[#111827] dark:text-white font-medium max-w-md truncate">
                                                {error.message}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary" className="font-mono bg-[#f3f4f6] dark:bg-neutral-800 border-[#e5e7eb] dark:border-white/10 text-[#111827] dark:text-white">
                                                    <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                                                    {formatOccurrences(error.occurrences)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1.5 text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewDetails(error);
                                                    }}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Content */}
                                        <CollapsibleContent asChild>
                                            <TableRow className="border-[#e5e7eb] dark:border-white/5 hover:bg-transparent">
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="px-6 py-4 bg-[#f9fafb] dark:bg-white/[0.02] border-t border-[#e5e7eb] dark:border-white/5">
                                                        <div className="space-y-4">
                                                            {/* Metadata */}
                                                            <div className="flex flex-wrap gap-4 text-sm">
                                                                {error.file && (
                                                                    <div className="flex items-center gap-2 text-[#6b7280] dark:text-neutral-400">
                                                                        <FileText className="h-4 w-4" />
                                                                        <span className="font-mono">{formatLocation(error)}</span>
                                                                    </div>
                                                                )}
                                                                {error.timestamp && (
                                                                    <div className="flex items-center gap-2 text-[#6b7280] dark:text-neutral-400">
                                                                        <Clock className="h-4 w-4" />
                                                                        <span className="font-mono">{error.timestamp}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Stack Trace */}
                                                            {error.full_trace && (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="text-xs font-semibold text-[#111827] dark:text-white uppercase tracking-wide">
                                                                            Stack Trace
                                                                        </h4>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 gap-1.5 text-xs"
                                                                            onClick={() => copyToClipboard(error.full_trace)}
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                            Copy
                                                                        </Button>
                                                                    </div>
                                                                    <pre className="bg-white dark:bg-neutral-900 border border-[#e5e7eb] dark:border-white/10 rounded-lg p-4 text-xs font-mono text-[#111827] dark:text-white overflow-x-auto max-h-64 overflow-y-auto">
                                                                        {error.full_trace}
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2 pt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 gap-1.5"
                                                                    onClick={() => onViewDetails(error)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    View in Sheet
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getErrorTypeIcon(type: string) {
    switch (type) {
        case 'error':
            return <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'warning':
            return <TriangleAlert className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'info':
            return <Info className="h-3 w-3 mr-1" aria-hidden="true" />;
        default:
            return null;
    }
}

function getSeverityIconComponent(severity: string) {
    switch (severity) {
        case 'critical':
            return <TriangleAlert className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'high':
            return <TriangleAlert className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'medium':
            return <TriangleAlert className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'low':
            return <Info className="h-3 w-3 mr-1" aria-hidden="true" />;
        default:
            return null;
    }
}
