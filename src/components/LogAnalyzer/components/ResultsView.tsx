import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SummaryCard } from './SummaryCard';
import { ErrorTable } from './ErrorTable';
import type { ParseResult, ParsedError } from '@/lib/wasm-parser';

interface ResultsViewProps {
    result: ParseResult;
    error: string | null;
    currentFile: File | null;
    summaryRef: React.RefObject<HTMLDivElement>;
    onViewDetails: (error: ParsedError) => void;
    onNewUpload: () => void;
}

/**
 * Display analysis results including summary stats and error table
 * Also handles error states and "no errors found" state
 */
export function ResultsView({
    result,
    error,
    currentFile,
    summaryRef,
    onViewDetails,
    onNewUpload,
}: ResultsViewProps) {
    return (
        <div className="pt-20 pb-16 space-y-6 max-w-7xl mx-auto px-8 animate-in fade-in-0 duration-500">
            {/* Error Message */}
            {error && (
                <Card className="border-red-500/20 bg-red-500/5" role="alert" aria-live="polite">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <p className="text-red-400 font-medium">Analysis Error</p>
                                <p className="text-red-300/80 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <SummaryCard
                stats={result.summary}
                fileName={currentFile?.name}
                fileSize={currentFile?.size}
                summaryRef={summaryRef}
            />

            {/* Separator between sections */}
            {result.errors.length > 0 && (
                <Separator className="bg-white/10" />
            )}

            {/* Error Table */}
            {result.errors.length > 0 ? (
                <ErrorTable
                    errors={result.errors}
                    onViewDetails={onViewDetails}
                />
            ) : (
                // No Errors Found
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-center gap-3 py-4">
                            <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden="true" />
                            <p className="text-green-400 text-lg font-medium">
                                No critical errors found! Your logs look clean.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={onNewUpload}
                                className="border-green-500/30 hover:bg-green-500/10 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Analyze Another File
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
