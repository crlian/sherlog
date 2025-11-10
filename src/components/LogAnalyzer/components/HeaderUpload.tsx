import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { SimpleFileUpload } from '@/components/ui/simple-file-upload';

interface HeaderUploadProps {
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
}

/**
 * Compact glassmorphism header that expands to show a dropzone
 * Appears in top-left when results are shown
 */
export function HeaderUpload({ onUpload, disabled = false }: HeaderUploadProps) {
    const [headerExpanded, setHeaderExpanded] = useState(false);
    const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

    // Track when file dialog opens/closes
    useEffect(() => {
        const handleFocus = () => {
            // When window regains focus after file dialog, mark dialog as closed
            setIsFileDialogOpen(false);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleFileUpload = async (file: File) => {
        setHeaderExpanded(false);
        setIsFileDialogOpen(false);
        await onUpload(file);
    };

    return (
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
                            onUpload={handleFileUpload}
                            disabled={disabled}
                            onFileDialogOpen={() => setIsFileDialogOpen(true)}
                            onFileDialogClose={() => setIsFileDialogOpen(false)}
                            className="[&>div]:!py-4 [&>div]:!px-3 [&>div]:!rounded-lg [&>div]:!shadow-none [&_svg]:!h-5 [&_svg]:!w-5 [&_p]:!text-xs"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
