import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
    FileText,
    AlertCircle,
    AlertTriangle,
    Info,
    Copy,
    Check,
    XCircle,
    TriangleAlert,
    Hash,
    Clock,
    TrendingUp,
    CheckCircle2,
    Eye,
    X,
    Upload,
    Shield,
    Lock,
    RotateCw,
    Sun,
    Moon,
    File
} from "lucide-react";
import { SimpleFileUpload } from "./ui/simple-file-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "./ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    parseLogFile,
    initWasm,
    type ParseResult,
    type ParsedError,
    getSeverityColor,
    getTypeColor,
    formatLocation,
    formatOccurrences,
} from "@/lib/wasm-parser";

export function LogAnalyzer() {
    const [result, setResult] = useState<ParseResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedError, setSelectedError] = useState<ParsedError | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [uploadExpanded, setUploadExpanded] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [headerExpanded, setHeaderExpanded] = useState(false);
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        initWasm();
    }, []);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Priority: 1) Saved preference, 2) System preference
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

        setTheme(initialTheme);
        setMounted(true);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
    };

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        setCurrentFile(file);
        setUploadExpanded(false); // Collapse after upload

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

    const handleNewUpload = () => {
        setResult(null);
        setError(null);
        setCurrentFile(null);
        setUploadExpanded(false);
        setHeaderExpanded(false);

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHeaderFileUpload = async (file: File) => {
        setHeaderExpanded(false);
        setIsFileDialogOpen(false);
        await handleFileUpload(file);
    };

    // Track when file dialog opens/closes
    useEffect(() => {
        const handleFocus = () => {
            // When window regains focus after file dialog, mark dialog as closed
            if (isFileDialogOpen) {
                setIsFileDialogOpen(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isFileDialogOpen]);

    const handleViewDetails = (error: ParsedError) => {
        setSelectedError(error);
        setSheetOpen(true);
    };

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

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
                {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </Button>

            {/* Compact Glassmorphism Header - Top Left - Expands to Dropzone */}
            {result && (
                <div
                    className="fixed top-6 left-6 z-50"
                    onMouseEnter={() => setHeaderExpanded(true)}
                    onMouseLeave={() => {
                        // Don't collapse if file dialog is open
                        if (!isFileDialogOpen) {
                            setHeaderExpanded(false);
                        }
                    }}
                >
                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        headerExpanded ? 'w-[280px]' : 'w-auto'
                    }`}>
                        {!headerExpanded ? (
                            // Compact state - Wider horizontal layout
                            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-[#e5e7eb] dark:border-white/10 rounded-xl shadow-lg px-7 py-3.5 transition-all duration-300 hover:shadow-xl cursor-pointer">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center gap-2.5">
                                        <Upload className="h-4.5 w-4.5 text-[#1e40af] dark:text-blue-400 transition-transform duration-300 hover:scale-110" />
                                        <h2 className="text-sm font-display font-bold text-[#111827] dark:text-white whitespace-nowrap">Sherlog</h2>
                                    </div>
                                    <div className="h-4 w-px bg-[#e5e7eb] dark:bg-white/10" />
                                    <div className="flex items-center gap-1.5 text-xs text-[#6b7280] dark:text-neutral-400">
                                        <Upload className="h-3.5 w-3.5" />
                                        <span className="whitespace-nowrap">New file</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Expanded state - Compact dropzone (expands downward)
                            <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-[#e5e7eb] dark:border-white/10 rounded-xl shadow-xl p-2">
                                <SimpleFileUpload
                                    placeholder="Drop new file here"
                                    maxSizeMB={100}
                                    accept={{ 'text/plain': ['.log', '.txt'] }}
                                    onUpload={handleHeaderFileUpload}
                                    disabled={loading}
                                    onFileDialogOpen={() => setIsFileDialogOpen(true)}
                                    onFileDialogClose={() => setIsFileDialogOpen(false)}
                                    className="[&>div]:!py-4 [&>div]:!px-3 [&>div]:!rounded-lg [&>div]:!shadow-none [&_svg]:!h-5 [&_svg]:!w-5 [&_p]:!text-xs"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Section */}
            {!result ? (
                // Initial State: Large centered upload with header
                <div className="min-h-screen flex flex-col items-center justify-center space-y-8 md:space-y-10 -mt-16">
                    {/* Sherlog Header - Only shown when no results */}
                    <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-6 duration-700 ease-out">
                        <h1 className="font-display text-7xl md:text-8xl font-bold leading-none" style={{letterSpacing: "-0.02em"}}>
                            <span className="bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#475569] dark:from-neutral-50 dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_4px_20px_rgba(255,255,255,0.1)]">
                                Sherlog
                            </span>
                        </h1>
                        <p className="font-sans text-base font-light text-[#475569] dark:text-neutral-400 tracking-wide">
                            Elementary, my dear developer
                        </p>
                    </header>

                    {/* Upload + Badges */}
                    <div className="space-y-8 w-full">
                        <div className="animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-150 ease-out">
                            <SimpleFileUpload
                                placeholder="Drop your evidence here"
                                maxSizeMB={100}
                                accept={{ 'text/plain': ['.log', '.txt'] }}
                                onUpload={handleFileUpload}
                                disabled={loading}
                            />
                        </div>


                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-6 animate-in fade-in-0 duration-700 delay-300 ease-out">
                            <Badge variant="secondary" className="text-[#64748b] dark:text-neutral-400 gap-2 bg-transparent border-0 shadow-none px-0">
                                <Shield className="h-4 w-4 text-[#94a3b8] dark:text-neutral-500" />
                                100% Local Parsing
                            </Badge>
                            <Badge variant="secondary" className="text-[#64748b] dark:text-neutral-400 gap-2 bg-transparent border-0 shadow-none px-0">
                                <Lock className="h-4 w-4 text-[#94a3b8] dark:text-neutral-500" />
                                Private by Design
                            </Badge>
                        </div>

                        {/* Hint */}
                        <div className="flex items-center justify-center gap-2 -mt-2 animate-in fade-in-0 duration-700 delay-400 ease-out">
                            <File className="h-3.5 w-3.5 text-[#94a3b8] dark:text-neutral-500" />
                            <p className="font-mono text-xs text-[#64748b] dark:text-neutral-400">.log, .txt • Max 100MB</p>
                        </div>
                    </div>
                </div>
            ) : (
                // After Upload: Results with sticky header
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
                                        {result.summary.total_lines.toLocaleString()} log entries analyzed
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-[#111827] dark:text-white truncate max-w-[200px]">
                                        {currentFile?.name || 'Unknown file'}
                                    </p>
                                    <p className="text-xs text-[#6b7280] dark:text-neutral-500 mt-0.5">
                                        {currentFile && formatFileSize(currentFile.size)}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                <StatCard
                                    label="Total Lines"
                                    value={result.summary.total_lines.toLocaleString()}
                                    className="text-[#6b7280] dark:text-neutral-400"
                                />
                                <StatCard
                                    label="Errors"
                                    value={result.summary.total_errors.toLocaleString()}
                                    className="text-red-600 dark:text-red-400"
                                />
                                <StatCard
                                    label="Warnings"
                                    value={result.summary.total_warnings.toLocaleString()}
                                    className="text-yellow-600 dark:text-yellow-400"
                                />
                                <StatCard
                                    label="Info"
                                    value={result.summary.total_info.toLocaleString()}
                                    className="text-[#1e40af] dark:text-blue-400"
                                />
                                <StatCard
                                    label="Unique Errors"
                                    value={result.summary.unique_errors.toString()}
                                    className="text-purple-600 dark:text-purple-400"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Separator between sections */}
                    {result.errors.length > 0 && (
                        <Separator className="bg-white/10" />
                    )}

                    {/* Error Table */}
                    {result.errors.length > 0 && (
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
                                        {result.errors.map((error, index) => (
                                            <TableRow
                                                key={error.id}
                                                className="border-[#e5e7eb] dark:border-white/5 hover:bg-[#f9fafb] dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => handleViewDetails(error)}
                                            >
                                                <TableCell className="font-mono text-[#9ca3af] dark:text-neutral-500 text-sm">
                                                    #{index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getTypeColor(error.type)}>
                                                        {getErrorTypeIcon(error.type)}
                                                        {error.type.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getSeverityColor(error.severity)}>
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
                                                            handleViewDetails(error);
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
                    )}

                    {/* No Errors Found */}
                    {result.errors.length === 0 && (
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
                                        onClick={handleNewUpload}
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
            )}

            {/* Error Detail Sheet */}
            {selectedError && (
                <ErrorDetailSheet
                    error={selectedError}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    onCopy={copyToClipboard}
                />
            )}
        </div>
    );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
    label: string;
    value: string;
    className?: string;
}

function StatCard({ label, value, className }: StatCardProps) {
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

// ============================================================================
// ERROR DETAIL SHEET COMPONENT
// ============================================================================

interface ErrorDetailSheetProps {
    error: ParsedError;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCopy: (text: string, label: string) => void;
}

function ErrorDetailSheet({ error, open, onOpenChange, onCopy }: ErrorDetailSheetProps) {
    const [copiedLocation, setCopiedLocation] = useState(false);
    const [copiedTrace, setCopiedTrace] = useState(false);

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
            return <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'medium':
            return <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'low':
            return <Info className="h-3 w-3 mr-1" aria-hidden="true" />;
        default:
            return null;
    }
}
