import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initWasm, type ParsedError } from "@/lib/wasm-parser";
import { useTheme, useLogParser } from "./hooks";
import {
    HeaderUpload,
    UploadSection,
    ResultsView,
    ErrorDetailSheet,
} from "./components";

/**
 * Main LogAnalyzer component - Refactored for better maintainability
 * Orchestrates file upload, parsing, theme management, and results display
 */
export function LogAnalyzer() {
    // Custom hooks for state management
    const { theme, mounted, toggleTheme } = useTheme();
    const {
        result,
        loading,
        error,
        currentFile,
        summaryRef,
        handleFileUpload,
        resetAnalysis,
    } = useLogParser();

    // Local state for error detail sheet
    const [selectedError, setSelectedError] = useState<ParsedError | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Initialize WASM parser on mount
    useEffect(() => {
        initWasm();
    }, []);

    // Handle viewing error details
    const handleViewDetails = (error: ParsedError) => {
        setSelectedError(error);
        setSheetOpen(true);
    };

    // Copy to clipboard helper
    const copyToClipboard = async (text: string, label: string = "Text") => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard", {
                description: label,
            });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy", {
                description: "Please try again",
            });
        }
    };

    // Prevent hydration mismatch - don't render until mounted
    if (!mounted) {
        return null;
    }

    return (
        <div className={`transition-all duration-500 ${result ? 'w-full' : 'max-w-lg'}`}>
            {/* Floating Theme Toggle - Top Right */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="fixed top-6 right-6 z-50 h-10 w-10 rounded-lg"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </Button>

            {/* Compact Header with Upload - Shown after results */}
            {result && (
                <HeaderUpload
                    onUpload={handleFileUpload}
                    disabled={loading}
                />
            )}

            {/* Main Content */}
            {!result ? (
                // Initial State: Large centered upload
                <UploadSection
                    onUpload={handleFileUpload}
                    disabled={loading}
                />
            ) : (
                // After Upload: Results with stats and error table
                <ResultsView
                    result={result}
                    error={error}
                    currentFile={currentFile}
                    summaryRef={summaryRef}
                    onViewDetails={handleViewDetails}
                    onNewUpload={resetAnalysis}
                />
            )}

            {/* Error Detail Sheet */}
            <ErrorDetailSheet
                error={selectedError}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onCopy={copyToClipboard}
            />
        </div>
    );
}
