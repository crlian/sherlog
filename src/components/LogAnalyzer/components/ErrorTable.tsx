import { useMemo } from 'react';
import { XCircle, TriangleAlert, Info, Eye, TrendingUp } from 'lucide-react';
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
    type ParsedError,
    getSeverityColor,
    getTypeColor,
    formatOccurrences,
} from '@/lib/wasm-parser';

interface ErrorTableProps {
    errors: ParsedError[];
    onViewDetails: (error: ParsedError) => void;
}

/**
 * Display errors in a sortable table
 * Shows error type, severity, message, occurrences, and actions
 */
export function ErrorTable({ errors, onViewDetails }: ErrorTableProps) {
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
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[60px]">#</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px]">Type</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px]">Severity</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium">Message</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[120px] text-right">Occurrences</TableHead>
                            <TableHead className="text-[#6b7280] dark:text-neutral-400 font-medium w-[100px] text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrichedErrors.map((error) => (
                            <TableRow
                                key={error.id}
                                className="border-[#e5e7eb] dark:border-white/5 hover:bg-[#f9fafb] dark:hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => onViewDetails(error)}
                            >
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
                        ))}
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
