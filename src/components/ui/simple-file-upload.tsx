"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, Loader2, AlertCircle } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "error";

export type SimpleFileUploadProps = {
  placeholder?: string;
  maxSizeMB?: number;
  accept?: Record<string, string[]>;
  onUpload?: (file: File) => Promise<void>;
  className?: string;
  loadingText?: string;
  disabled?: boolean;
  onFileDialogOpen?: () => void;
  onFileDialogClose?: () => void;
};

export function SimpleFileUpload({
  placeholder = "Drop your evidence here",
  maxSizeMB = 10,
  accept,
  onUpload,
  className,
  loadingText = "Analyzing case",
  disabled = false,
  onFileDialogOpen,
  onFileDialogClose,
}: SimpleFileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Track file dialog state
  React.useEffect(() => {
    const handleFocus = () => {
      onFileDialogClose?.();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [onFileDialogClose]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle validation errors
      if (fileRejections.length > 0) {
        const errorMsg = fileRejections[0].errors[0].message;
        setError(errorMsg);
        setStatus("error");
        return;
      }

      // Only take first file (single upload)
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setStatus("uploading");

      try {
        if (onUpload) {
          await onUpload(file);
        }
        setStatus("idle");
      } catch (e: any) {
        setError(e?.message ?? "Upload failed");
        setStatus("error");
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: maxSizeBytes,
    accept,
    disabled: disabled || status === "uploading",
    noClick: true, // We'll handle click manually to track dialog state
  });

  const handleClick = () => {
    onFileDialogOpen?.();
    open();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        onClick={handleClick}
        className={cn(
          "group rounded-3xl border-2 border-dashed py-20 px-10 text-center transition-all duration-500 ease-out backdrop-blur-md",
          "bg-white/90 dark:bg-neutral-900/50 shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
          disabled || status === "uploading" ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          isDragActive && !disabled && "border-[#1e40af] dark:border-blue-500/70 bg-blue-50/80 dark:bg-blue-600/15 shadow-[0_25px_100px_rgba(30,64,175,0.15)] dark:shadow-[0_25px_100px_rgba(37,99,235,0.35)] ring-2 ring-blue-500/25 dark:ring-blue-500/30 scale-[1.02]",
          status === "error" && "border-red-500/60 bg-red-50/80 dark:bg-red-500/15 shadow-[0_25px_100px_rgba(239,68,68,0.15)] dark:shadow-[0_25px_100px_rgba(239,68,68,0.25)] ring-2 ring-red-500/25 dark:ring-red-500/30",
          status === "idle" && !isDragActive && !disabled && "border-[#cbd5e1] dark:border-white/10 hover:border-[#1e40af]/60 dark:hover:border-blue-500/50 hover:bg-[#f8fafc] dark:hover:bg-neutral-900/70 hover:shadow-[0_25px_90px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_25px_90px_rgba(0,0,0,0.35)] hover:ring-2 hover:ring-blue-500/10 dark:hover:ring-blue-500/15 hover:scale-[1.01]"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-8">
          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-14 w-14 animate-spin text-blue-600 dark:text-blue-500 drop-shadow-[0_4px_12px_rgba(37,99,235,0.3)]" />
              <div className="flex items-center gap-1">
                <span className="font-sans text-base font-medium text-blue-600 dark:text-blue-500">{loadingText}</span>
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:200ms]">.</span>
                <span className="animate-pulse [animation-delay:400ms]">.</span>
              </div>
            </div>
          ) : status === "error" ? (
            <AlertCircle className="h-14 w-14 text-red-500 stroke-[1.5] drop-shadow-[0_4px_12px_rgba(239,68,68,0.25)]" />
          ) : (
            <Upload
              className={cn(
                "h-14 w-14 transition-all duration-500 ease-out stroke-[1.5]",
                isDragActive
                  ? "text-[#1e40af] dark:text-blue-500 scale-110 drop-shadow-[0_4px_16px_rgba(37,99,235,0.4)]"
                  : "text-[#64748b] dark:text-white/40 group-hover:text-[#1e40af] dark:group-hover:text-blue-500/70 group-hover:scale-105 group-hover:drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
              )}
            />
          )}

          {status !== "uploading" && (
            <p className="font-sans text-base font-medium text-[#475569] dark:text-neutral-300">
              {placeholder}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="font-sans text-sm font-normal text-red-500 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
