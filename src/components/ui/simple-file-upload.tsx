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
};

export function SimpleFileUpload({
  placeholder = "Drop your evidence here",
  maxSizeMB = 10,
  accept,
  onUpload,
  className,
  loadingText = "Analyzing case",
  disabled = false,
}: SimpleFileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: maxSizeBytes,
    accept,
    disabled: disabled || status === "uploading",
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "group rounded-xl border-2 border-dashed py-16 px-8 text-center transition-all duration-300 ease-out backdrop-blur-sm",
          "bg-neutral-900/40 shadow-[0_0_50px_-15px_rgba(0,0,0,0.3)]",
          disabled || status === "uploading" ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          isDragActive && !disabled && "border-blue-500/60 bg-blue-600/10 shadow-2xl shadow-blue-600/30 scale-[1.02]",
          status === "error" && "border-red-500/60 bg-red-500/10 shadow-2xl shadow-red-600/20",
          status === "idle" && !isDragActive && !disabled && "border-white/10 hover:border-blue-500/40 hover:bg-neutral-900/60 hover:shadow-[0_0_60px_-10px_rgba(0,0,0,0.4)]"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-6">
          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="flex items-center gap-1">
                <span className="font-sans text-sm font-normal text-blue-500">{loadingText}</span>
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:200ms]">.</span>
                <span className="animate-pulse [animation-delay:400ms]">.</span>
              </div>
            </div>
          ) : status === "error" ? (
            <AlertCircle className="h-12 w-12 text-red-500" />
          ) : (
            <Upload
              className={cn(
                "h-12 w-12 transition-all duration-300 ease-out",
                isDragActive ? "text-blue-500 scale-110" : "text-white/40 group-hover:text-blue-500/60 group-hover:scale-105"
              )}
            />
          )}

          {status !== "uploading" && (
            <p className="font-sans text-sm font-normal text-neutral-300">
              {placeholder}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="font-sans text-sm font-normal text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
