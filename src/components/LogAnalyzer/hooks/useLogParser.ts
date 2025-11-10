import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { parseLogFile, parseLogFileStreaming, type ParseResult } from '@/lib/wasm-parser';

interface UseLogParserReturn {
    result: ParseResult | null;
    loading: boolean;
    error: string | null;
    currentFile: File | null;
    progress: number;
    summaryRef: React.RefObject<HTMLDivElement>;
    handleFileUpload: (file: File) => Promise<void>;
    resetAnalysis: () => void;
}

// File size threshold for streaming (100MB)
const STREAMING_THRESHOLD = 100 * 1024 * 1024;

/**
 * Custom hook to manage log file parsing logic
 * Handles file upload, parsing, error handling, and result management
 */
export function useLogParser(): UseLogParserReturn {
    const [result, setResult] = useState<ParseResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const summaryRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        setCurrentFile(file);
        setProgress(0);

        try {
            let parseResult: ParseResult;

            // Use streaming for files larger than 100MB
            if (file.size > STREAMING_THRESHOLD) {
                const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                toast.info("Large file detected", {
                    description: `Processing ${fileSizeMB}MB file with streaming...`,
                });

                parseResult = await parseLogFileStreaming(file, (progressValue) => {
                    setProgress(Math.round(progressValue));
                });
            } else {
                // Use legacy method for smaller files (faster for small files)
                parseResult = await parseLogFile(file);
                setProgress(100);
            }

            // Validate result structure before using it
            if (!parseResult || !parseResult.summary) {
                throw new Error("Invalid parse result: missing summary data");
            }

            setResult(parseResult);

            // Auto-focus results for accessibility
            setTimeout(() => {
                summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                summaryRef.current?.focus();
            }, 100);

            toast.success("Analysis complete", {
                description: `Found ${parseResult.summary.unique_errors} unique error patterns`,
            });
        } catch (err) {
            console.error("Error parsing log file:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to parse log file";
            setError(errorMessage);
            toast.error("Analysis failed", {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const resetAnalysis = () => {
        setResult(null);
        setError(null);
        setCurrentFile(null);
        setProgress(0);

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return {
        result,
        loading,
        error,
        currentFile,
        progress,
        summaryRef,
        handleFileUpload,
        resetAnalysis,
    };
}
