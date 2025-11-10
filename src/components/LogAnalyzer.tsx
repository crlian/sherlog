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

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

    return (
        <div className={`transition-all duration-500 ${result ? 'w-full' : 'max-w-lg'}`}>
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in-0 duration-300">
                    <Card className="bg-neutral-900 border-blue-500/30 p-6 shadow-2xl shadow-blue-500/20">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <div>
                                <p className="text-white font-medium">Analyzing evidence...</p>
                                <p className="text-neutral-400 text-sm">{currentFile?.name}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Sticky Contextual Header (shown after results) */}
            {result && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 shadow-lg bounce-in">
                    <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-4">
                        {/* Left: Branding + File Info */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-display font-bold text-white">🕵️ Sherlog</span>
                            </div>

                            <Separator orientation="vertical" className="h-6 bg-white/10" />

                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-white truncate max-w-[200px]">
                                    {currentFile?.name || 'Unknown file'}
                                </span>
                                <span className="text-xs text-neutral-500">
                                    ({currentFile && formatFileSize(currentFile.size)})
                                </span>
                            </div>
                        </div>

                        {/* Right: Stats + Actions */}
                        <div className="flex items-center gap-4">
                            {/* Inline Stats */}
                            <div className="hidden md:flex items-center gap-4 text-xs font-mono">
                                <span className="text-neutral-400">
                                    <span className="text-red-400 font-semibold"># {result.summary.total_errors}</span>
                                </span>
                                <span className="text-neutral-400">|</span>
                                <span className="text-neutral-400">
                                    <span className="text-yellow-400 font-semibold">⚠️ {result.summary.total_warnings}</span>
                                </span>
                                <span className="text-neutral-400">|</span>
                                <span className="text-neutral-400">
                                    <span className="text-blue-400 font-semibold">ⓘ {result.summary.total_info}</span>
                                </span>
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-6 bg-white/10" />

                            {/* New File Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNewUpload}
                                className="h-9 gap-2 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <RotateCw className="h-3.5 w-3.5" />
                                New File
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Section */}
            {!result ? (
                // Initial State: Large centered upload with header
                <div className="min-h-screen flex flex-col items-center justify-center space-y-16 -mt-16">
                    {/* Sherlog Header - Only shown when no results */}
                    <header className="text-center space-y-3 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                        <h1 className="font-display text-6xl font-bold text-neutral-50 leading-none" style={{letterSpacing: "-0.02em"}}>
                            <span className="bg-gradient-to-b from-neutral-50 to-neutral-200 bg-clip-text text-transparent">
                                Sherlog
                            </span>
                        </h1>
                        <p className="font-sans text-sm font-light text-neutral-400 tracking-wide">
                            Elementary, my dear developer
                        </p>
                    </header>

                    {/* Upload + Badges */}
                    <div className="space-y-6 w-full animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-100">
                        <SimpleFileUpload
                            placeholder="Drop your evidence here"
                            maxSizeMB={100}
                            accept={{ 'text/plain': ['.log', '.txt'] }}
                            onUpload={handleFileUpload}
                            disabled={loading}
                        />

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-3">
                            <Badge variant="secondary" className="text-white gap-1.5 bg-neutral-900/60 border-white/10">
                                <Shield className="h-4 w-4" />
                                100% Local Parsing
                            </Badge>
                            <Badge variant="secondary" className="text-white gap-1.5 bg-neutral-900/60 border-white/10">
                                <Lock className="h-4 w-4" />
                                Private by Design
                            </Badge>
                        </div>

                        {/* Hint */}
                        <p className="font-mono text-xs text-center text-neutral-500">.log, .txt • Max 100MB</p>
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
                    <Card className="bg-neutral-900/60 border-white/10">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                <CardTitle
                                    ref={summaryRef}
                                    tabIndex={-1}
                                    className="text-white outline-none"
                                >
                                    Case Summary
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Analysis of {result.summary.total_lines.toLocaleString()} log entries
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <StatCard
                                    label="Total Lines"
                                    value={result.summary.total_lines.toLocaleString()}
                                    icon={FileText}
                                    className="text-neutral-400"
                                />
                                <StatCard
                                    label="Errors"
                                    value={result.summary.total_errors.toLocaleString()}
                                    icon={XCircle}
                                    className="text-red-400"
                                />
                                <StatCard
                                    label="Warnings"
                                    value={result.summary.total_warnings.toLocaleString()}
                                    icon={TriangleAlert}
                                    className="text-yellow-400"
                                />
                                <StatCard
                                    label="Info"
                                    value={result.summary.total_info.toLocaleString()}
                                    icon={Info}
                                    className="text-blue-400"
                                />
                                <StatCard
                                    label="Unique Errors"
                                    value={result.summary.unique_errors.toString()}
                                    icon={Hash}
                                    className="text-purple-400"
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
