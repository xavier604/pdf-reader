"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFilesDropped: (files: FileList) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  children: React.ReactNode;
}

function filterPdfFiles(files: FileList): FileList {
  const dataTransfer = new DataTransfer();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      dataTransfer.items.add(file);
    }
  }
  return dataTransfer.files;
}

export function DropZone({ onFilesDropped, fileInputRef, children }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const pdfFiles = filterPdfFiles(e.dataTransfer.files);
      if (pdfFiles.length > 0) {
        onFilesDropped(pdfFiles);
      }
    },
    [onFilesDropped],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesDropped(files);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [onFilesDropped],
  );

  return (
    <div
      role="application"
      className="relative min-h-screen"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-background)/80 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center w-[calc(100%-48px)] h-[calc(100%-48px)] border-2 border-dashed border-(--color-accent) rounded-2xl">
            <svg
              aria-hidden="true"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4"
            >
              <path d="M24 34V14" />
              <polyline points="16,22 24,14 32,22" />
              <line x1="8" y1="40" x2="40" y2="40" />
            </svg>
            <p className="text-lg font-medium text-(--color-accent)">Drop PDF here</p>
          </div>
        </div>
      )}
    </div>
  );
}
