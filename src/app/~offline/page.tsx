export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-semibold mb-2">You&apos;re offline</h1>
      <p className="text-[var(--color-text-secondary)]">
        Check your internet connection and try again.
      </p>
    </div>
  );
}
