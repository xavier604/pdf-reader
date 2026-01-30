"use client";

import { useCallback, useState } from "react";

export interface ErrorEntry {
  id: number;
  message: string;
  source: string;
  action: string;
  timestamp: number;
  stack?: string;
}

const MAX_ERRORS = 50;

const errorStore: ErrorEntry[] = [];
let nextId = 1;

function extractErrorInfo(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  return { message: String(error) };
}

export function createErrorReporter(source: string) {
  return {
    report(error: unknown, action: string): void {
      const { message, stack } = extractErrorInfo(error);
      const entry: ErrorEntry = {
        id: nextId++,
        message,
        source,
        action,
        timestamp: Date.now(),
        stack,
      };
      errorStore.push(entry);
      if (errorStore.length > MAX_ERRORS) errorStore.shift();
      console.error(`[ErrorReporter] ${source}/${action}:`, message);
    },
    getErrors: () => [...errorStore],
    clear: () => {
      errorStore.length = 0;
    },
  };
}

export function useErrorReporter() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  const reportError = useCallback((error: unknown, source: string, action: string) => {
    const { message, stack } = extractErrorInfo(error);
    const entry: ErrorEntry = {
      id: nextId++,
      message,
      source,
      action,
      timestamp: Date.now(),
      stack,
    };
    errorStore.push(entry);
    if (errorStore.length > MAX_ERRORS) errorStore.shift();
    console.error(`[ErrorReporter] ${source}/${action}:`, message);
    setErrors([...errorStore]);
  }, []);

  const clearErrors = useCallback(() => {
    errorStore.length = 0;
    setErrors([]);
  }, []);

  const lastError = errors.length > 0 ? errors[errors.length - 1] : null;

  return { errors, reportError, clearErrors, lastError };
}
