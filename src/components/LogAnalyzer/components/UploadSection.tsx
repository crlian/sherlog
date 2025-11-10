import { Shield, Lock, File } from 'lucide-react';
import { SimpleFileUpload } from '@/components/ui/simple-file-upload';
import { Badge } from '@/components/ui/badge';

interface UploadSectionProps {
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
}

/**
 * Initial upload section shown before any file is analyzed
 * Includes Sherlog header, upload zone, and trust badges
 */
export function UploadSection({ onUpload, disabled = false }: UploadSectionProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-8 md:space-y-10 -mt-16">
            {/* Sherlog Header - Only shown when no results */}
            <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-6 duration-700 ease-out">
                <h1 className="font-display text-7xl md:text-8xl font-bold leading-none" style={{ letterSpacing: "-0.02em" }}>
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
                        onUpload={onUpload}
                        disabled={disabled}
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
    );
}
