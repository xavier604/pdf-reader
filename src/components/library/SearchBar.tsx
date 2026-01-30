"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      {/* Search icon */}
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-secondary)"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="5" />
        <line x1="11" y1="11" x2="14.5" y2="14.5" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search PDFs..."
        className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-4 py-2 pl-10 text-(--color-foreground) placeholder:text-(--color-text-secondary) focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent transition-shadow"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-secondary) hover:text-(--color-foreground) transition-colors"
          aria-label="Clear search"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
