import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { parseLogFile, type ParseResult } from '@/lib/wasm-parser';

interface UseLogParserReturn {
    result: ParseResult | null;
    loading: boolean;
    error: string | null;
    currentFile: File | null;
    summaryRef: React.RefObject<HTMLDivElement>;
    handleFileUpload: (file: File) => Promise<void>;
    resetAnalysis: () => void;
}

/**
 * Custom hook to manage log file parsing logic
 * Handles file upload, parsing, error handling, and result management
 */
export function useLogParser(): UseLogParserReturn {
    const [result, setResult] = useState<ParseResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const summaryRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        setCurrentFile(file);

        try {
            const parseResult = await parseLogFile(file);
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
        }
    };

    const resetAnalysis = () => {
        setResult(null);
        setError(null);
        setCurrentFile(null);

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return {
        result,
        loading,
        error,
        currentFile,
        summaryRef,
        handleFileUpload,
        resetAnalysis,
    };
}
