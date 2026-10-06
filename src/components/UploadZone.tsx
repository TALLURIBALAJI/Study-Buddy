import React, { useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface UploadZoneProps {
  compact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ compact = false }) => {
  const { uploadFiles, uploadingDocName, uploadingState } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isBusy = Boolean(uploadingState);

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        className={`group relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
        } ${isBusy ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          className="hidden"
        />
        {isBusy ? (
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <Loader2 className="size-4 animate-spin" />
            <span>{uploadingState}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground">
            <CloudUpload className="size-4 text-primary" />
            <span>Drop or upload files (PDF, DOCX, TXT)</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isBusy && inputRef.current?.click()}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        isDragging
          ? 'border-primary bg-primary/5 shadow-inner'
          : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 shadow-sm'
      } ${isBusy ? 'pointer-events-none opacity-90' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mb-3 group-hover:scale-105 transition-transform">
          {isBusy ? <Loader2 className="size-6 animate-spin" /> : <CloudUpload className="size-6" />}
        </span>

        {isBusy ? (
          <div>
            <h3 className="font-semibold text-base text-foreground">{uploadingState}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{uploadingDocName}</p>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-base text-foreground">
              Upload or drop study materials
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, DOCX or TXT · up to 20 MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
