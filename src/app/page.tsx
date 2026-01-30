"use client";

import { LibraryView } from "@/components/library/LibraryView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function HomePage() {
  return (
    <ErrorBoundary>
      <LibraryView />
    </ErrorBoundary>
  );
}
