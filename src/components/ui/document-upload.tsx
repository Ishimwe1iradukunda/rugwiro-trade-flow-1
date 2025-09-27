import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type DocumentUploadProps = {
  id?: string;
  label?: string;
  description?: string;
  accept?: string; // e.g. "image/*,.pdf,.docx"
  multiple?: boolean;
  disabled?: boolean;
  onFiles?: (files: File[]) => void;
  maxSizeMb?: number; // optional client-side guard
};

export const DocumentUpload = ({
  id = "document-upload",
  label = "Upload file(s)",
  description,
  accept,
  multiple,
  disabled,
  onFiles,
  maxSizeMb,
}: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastFiles, setLastFiles] = useState<File[]>([]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const filtered = typeof maxSizeMb === "number"
        ? arr.filter((f) => f.size <= maxSizeMb * 1024 * 1024)
        : arr;
      setLastFiles(filtered);
      onFiles?.(filtered);
    },
    [onFiles, maxSizeMb]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div
        className={[
          "mt-1 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
          disabled ? "opacity-60" : "",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          if (e.dataTransfer?.files?.length) {
            handleFiles(e.dataTransfer.files);
          }
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length) handleFiles(files);
          }}
        />
        <p className="text-sm">Drag and drop files here, or</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Browse files
        </Button>
        <div className="mt-2 text-xs text-muted-foreground">
          {accept ? <p>Allowed: {accept}</p> : null}
          {typeof maxSizeMb === "number" ? <p>Max size: {maxSizeMb} MB per file</p> : null}
        </div>
      </div>

      {lastFiles.length > 0 && (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Selected</p>
          <ul className="space-y-1 text-sm">
            {lastFiles.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;