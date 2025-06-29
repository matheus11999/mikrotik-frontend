"use client";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  name?: string;
  className?: string;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  value,
  onChange,
  onSubmit,
  name,
  className,
}: PlaceholdersAndVanishInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value) {
      setShowPlaceholder(false);
      return;
    }
    setShowPlaceholder(true);
    intervalRef.current = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [value, placeholders.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={showPlaceholder ? placeholders[placeholderIndex] : ""}
      className={cn(
        "w-full p-3 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300",
        className
      )}
      autoComplete="off"
    />
  );
} 