"use client";

import * as React from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";

type FileUploadFieldProps = {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
};

export function FileUploadField({
  files,
  onChange,
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  label = "Attachments",
  hint = "Drag and drop files here, or click to browse.",
  className
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const previews = React.useMemo(
    () =>
      files.map((file, index) => ({
        file,
        index,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      })),
    [files]
  );

  React.useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [previews]);

  function addFiles(incoming: FileList | File[]) {
    onChange([...files, ...Array.from(incoming)]);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <section className={cn("space-y-3", className)}>
      <header>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </header>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">Drop files or click to upload</p>
        <p className="text-xs text-muted-foreground">Images, PDF, DOC up to 15MB each</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {previews.map(({ file, index, url }) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
            >
              {url ? (
                <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </span>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                onClick={() => removeAt(index)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}