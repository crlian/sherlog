import { useState } from 'react';
import { Copy, Check, X, Clock, TrendingUp } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    type ParsedError,
    getSeverityColor,
    getTypeColor,
    formatLocation,
    formatOccurrences,
} from '@/lib/wasm-parser';
import { XCircle, TriangleAlert, Info, AlertCircle } from 'lucide-react';

interface ErrorDetailSheetProps {
    error: ParsedError | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCopy: (text: string, label: string) => void;
}

/**
 * Side sheet panel showing detailed error information
 * Includes full stack trace, location, timestamp, and copy actions
 */
export function ErrorDetailSheet({ error, open, onOpenChange, onCopy }: ErrorDetailSheetProps) {
    const [copiedLocation, setCopiedLocation] = useState(false);
    const [copiedTrace, setCopiedTrace] = useState(false);

    if (!error) return null;

    const handleCopyLocation = async () => {
        await onCopy(formatLocation(error), "File location");
        setCopiedLocation(true);
        setTimeout(() => setCopiedLocation(false), 2000);
    };

    const handleCopyTrace = async () => {
        await onCopy(error.full_trace, "Stack trace");
        setCopiedTrace(true);
        setTimeout(() => setCopiedTrace(false), 2000);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl bg-white dark:bg-neutral-950 border-[#e5e7eb] dark:border-white/10 overflow-y-auto">
                <SheetHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <SheetTitle className="text-[#111827] dark:text-white text-xl font-bold pr-8">
                            Error Details
                        </SheetTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 hover:bg-[#f3f4f6] dark:hover:bg-white/10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getTypeColor(error.type)}>
                            {getErrorTypeIcon(error.type)}
                            {error.type.toUpperCase()}
                        </Badge>
                        <Badge className={getSeverityColor(error.severity)}>
                            {getSeverityIconComponent(error.severity)}
                            {error.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="font-mono">
                            <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                            {formatOccurrences(error.occurrences)}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Error Message */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[#6b7280] dark:text-neutral-400 uppercase tracking-wide">
                            Error Message
                        </h3>
                        <p className="text-[#111827] dark:text-white font-medium text-base leading-relaxed">
                            {error.message}
                        </p>
                    </div>

                    <Separator className="bg-[#e5e7eb] dark:bg-white/10" />

                    {/* Location */}
                    {error.file && (
                        <>
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-[#6b7280] dark:text-neutral-400 uppercase tracking-wide">
                                    Location
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <code className="text-sm text-[#111827] dark:text-neutral-300 font-mono bg-[#f3f4f6] dark:bg-neutral-900/80 px-3 py-2 rounded border border-[#e5e7eb] dark:border-white/5">
                                        {formatLocation(error)}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyLocation}
                                        className="h-8 gap-1.5 text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {copiedLocation ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <Separator className="bg-[#e5e7eb] dark:bg-white/10" />
                        </>
                    )}

                    {/* Timestamp */}
                    {error.timestamp && (
                        <>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-[#6b7280] dark:text-neutral-400 uppercase tracking-wide">
                                    Timestamp
                                </h3>
                                <div className="flex items-center gap-2 text-[#111827] dark:text-neutral-300 font-mono text-sm">
                                    <Clock className="h-4 w-4" aria-hidden="true" />
                                    <time dateTime={error.timestamp}>{error.timestamp}</time>
                                </div>
                            </div>
                            <Separator className="bg-[#e5e7eb] dark:bg-white/10" />
                        </>
                    )}

                    {/* Full Stack Trace */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-[#6b7280] dark:text-neutral-400 uppercase tracking-wide">
                                Full Stack Trace
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyTrace}
                                className="h-8 gap-1.5 text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {copiedTrace ? (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <pre className="text-xs text-[#111827] dark:text-neutral-300 bg-[#f3f4f6] dark:bg-neutral-900/80 p-4 rounded-lg overflow-x-auto border border-[#e5e7eb] dark:border-white/5 font-mono leading-relaxed max-h-96">
                            {error.full_trace}
                        </pre>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
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
            return <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />;
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
