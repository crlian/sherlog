import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { parseLogFile, parseLogFileStreaming, parseLogContent, setCustomPatterns, clearCustomPatterns, type ParseResult } from '@/lib/wasm-parser';
import { getPatterns } from '@/lib/pattern-storage';

interface UseLogParserReturn {
    result: ParseResult | null;
    loading: boolean;
    error: string | null;
    currentFile: File | null;
    progress: number;
    summaryRef: React.RefObject<HTMLDivElement>;
    handleFileUpload: (file: File) => Promise<void>;
    reAnalyzeWithPatterns: () => Promise<void>;
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

    // Store the raw log content for re-analysis
    const logContentRef = useRef<string | null>(null);

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        setCurrentFile(file);
        setProgress(0);

        try {
            let parseResult: ParseResult;

            // Read file content for potential re-analysis
            const content = await file.text();
            logContentRef.current = content;

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
                // Use content for smaller files (faster)
                parseResult = await parseLogContent(content);
                setProgress(100);
            }

            // Validate result structure before using it
            if (!parseResult || !parseResult.summary) {
                throw new Error("Invalid parse result: missing summary data");
            }

            setResult(parseResult);

            // Scroll to top to show results (no gap between header and content)
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

    /**
     * Re-analyze the current log with learned patterns applied
     * This loads patterns from localStorage and re-parses the log
     */
    const reAnalyzeWithPatterns = async () => {
        if (!logContentRef.current) {
            toast.error("No log file loaded", {
                description: "Please upload a log file first"
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Load patterns from localStorage
            const patterns = getPatterns();

            if (patterns.length === 0) {
                toast.info("No patterns found", {
                    description: "Teach some patterns first to apply them"
                });
                setLoading(false);
                return;
            }

            // Convert patterns to format expected by WASM
            const customPatterns = patterns.map(p => ({
                regex: p.regex,
                template: p.template,
                priority: 100  // High priority
            }));

            // Set custom patterns in WASM
            setCustomPatterns(customPatterns);

            // Re-parse the log content
            const parseResult = await parseLogContent(logContentRef.current);

            // Clear custom patterns after parsing
            clearCustomPatterns();

            // Validate result
            if (!parseResult || !parseResult.summary) {
                throw new Error("Invalid parse result: missing summary data");
            }

            setResult(parseResult);

            toast.success("Re-analysis complete", {
                description: `Applied ${patterns.length} learned pattern(s)`
            });
        } catch (err) {
            console.error("Error re-analyzing log:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to re-analyze log";
            setError(errorMessage);
            toast.error("Re-analysis failed", {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const resetAnalysis = () => {
        setResult(null);
        setError(null);
        setCurrentFile(null);
        setProgress(0);
        logContentRef.current = null;

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
        reAnalyzeWithPatterns,
        resetAnalysis,
    };
}
