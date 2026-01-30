"use client";

import { use } from "react";
import { ReaderView } from "@/components/reader/ReaderView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ErrorBoundary>
      <ReaderView pdfId={id} />
    </ErrorBoundary>
  );
}
