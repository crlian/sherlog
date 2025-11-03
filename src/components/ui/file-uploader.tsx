"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils"; // provided by shadcn init
import {
  Upload,
  FileIcon,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type UploadStatus = "idle" | "uploading" | "done" | "error";

type Item = {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  url?: string;
};

export type FileUploaderProps = {
  title?: string;
  description?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  // MIME accept (react-dropzone format)
  accept?: Record<string, string[]>;
  // Upload logic per file. Should resolve with an optional URL when complete.
  onUpload?: (file: File, onProgress: (p: number) => void) => Promise<{ url?: string }>;
  // Callback fired whenever the list of items changes.
  onChange?: (items: Item[]) => void;
  // Optional helper text for the notes field.
  notesPlaceholder?: string;
};

export function FileUploader({
  title = "Upload your files",
  description = "Drag and drop files here or click the button to browse.",
  multiple = true,
  maxSizeMB = 25,
  accept,
  onUpload,
  onChange,
  notesPlaceholder = "Notes (optional)...",
}: FileUploaderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");

  const maxSizeBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle rejections for size/type
      const rejectedMsgs =
        fileRejections?.map((r) => `${r.file.name}: ${r.errors.map((e) => e.message).join(", ")}`) ??
        [];
      if (rejectedMsgs.length) {
        // Create error entries to surface the validation issue in the list
        const errItems: Item[] = rejectedMsgs.map((msg, idx) => ({
          id: `err-${Date.now()}-${idx}`,
          file: new File([], "invalid"),
          progress: 0,
          status: "error",
          error: msg,
        }));
        setItems((prev) => {
          const next = [...prev, ...errItems];
          onChange?.(next);
          return next;
        });
      }

      const newItems: Item[] = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: "idle",
      }));

      setItems((prev) => {
        const next = [...prev, ...newItems];
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple,
    maxSize: maxSizeBytes,
    accept,
    noClick: true, // we use our custom button instead of the dropzone default
  });

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      onChange?.(next);
      return next;
    });
  };

  const uploadAll = async () => {
    if (!onUpload) return;
    for (const it of items) {
      if (it.status === "done") continue;

      setItems((prev) =>
        prev.map((p) => (p.id === it.id ? { ...p, status: "uploading", progress: 1 } : p))
      );

      try {
        const res = await onUpload(it.file, (p) => {
          setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, progress: p } : x)));
        });
        setItems((prev) =>
          prev.map((p) =>
            p.id === it.id
              ? { ...p, status: "done", progress: 100, url: res?.url }
              : p
          )
        );
      } catch (e: any) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === it.id
              ? { ...p, status: "error", error: e?.message ?? "Upload failed" }
              : p
          )
        );
      }
    }
  };

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base md:text-lg font-semibold leading-none tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          "bg-background/50",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-6 w-6 opacity-70" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? "Drop the files here..." : "Drag files here or use the button"}
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Button type="button" variant="secondary" onClick={open}>
              Choose files
            </Button>
            <Badge variant="outline">{multiple ? "Multiple" : "Single"}</Badge>
            <Badge variant="outline">{`Max ${maxSizeMB} MB`}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="uploader-notes">Notes</Label>
        <Textarea
          id="uploader-notes"
          placeholder={notesPlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Files</h4>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems([])}
              disabled={!items.length}
            >
              Clear
            </Button>
            <Button type="button" size="sm" onClick={uploadAll} disabled={!onUpload || !items.length}>
              Upload all
            </Button>
          </div>
        </div>

        <ScrollArea className="h-56 rounded-md border">
          <div className="p-3 space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No files yet.</p>
            )}

            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-md bg-muted">
                  {it.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.preview}
                      alt={it.file.name}
                      className="h-10 w-10 object-cover rounded-md"
                    />
                  ) : (
                    <FileIcon className="h-5 w-5 opacity-70" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.file.name || it.error}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.file.size ? prettyBytes(it.file.size) : "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {it.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                      {it.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {it.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(it.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {it.status !== "idle" && (
                    <Progress value={it.progress} className="h-2" />
                  )}

                  {it.url && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Open uploaded file
                    </a>
                  )}

                  {it.status === "error" && it.error && (
                    <p className="text-xs text-red-600">{it.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}

// Simple helper to format byte sizes
function prettyBytes(n: number) {
  if (!n && n !== 0) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let num = n;
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024;
    i++;
  }
  return `${num.toFixed(num < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
