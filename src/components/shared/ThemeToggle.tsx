"use client";

import type React from "react";
import type { ThemePreference } from "@/types";
import { useThemeContext } from "./ThemeProvider";

const nextTheme: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const themeLabel: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="4" />
      <line x1="10" y1="1" x2="10" y2="3" />
      <line x1="10" y1="17" x2="10" y2="19" />
      <line x1="1" y1="10" x2="3" y2="10" />
      <line x1="17" y1="10" x2="19" y2="10" />
      <line x1="3.64" y1="3.64" x2="5.05" y2="5.05" />
      <line x1="14.95" y1="14.95" x2="16.36" y2="16.36" />
      <line x1="3.64" y1="16.36" x2="5.05" y2="14.95" />
      <line x1="14.95" y1="5.05" x2="16.36" y2="3.64" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.39 12.424A7.5 7.5 0 1 1 7.576 2.61a5.5 5.5 0 0 0 9.814 9.814z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="16" height="11" rx="1.5" />
      <line x1="7" y1="17" x2="13" y2="17" />
      <line x1="10" y1="14" x2="10" y2="17" />
    </svg>
  );
}

const themeIcon: Record<ThemePreference, React.ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
};

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();
  const next = nextTheme[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Current: ${themeLabel[theme]}. Switch to ${themeLabel[next]}`}
      aria-label={`Current theme: ${themeLabel[theme]}. Switch to ${themeLabel[next]}`}
    >
      {themeIcon[theme]}
    </button>
  );
}
