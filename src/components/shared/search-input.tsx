"use client";

// Client: debounced typing synced to the URL.
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  /** Accessible label (also the placeholder unless one is given). */
  label: string;
  placeholder?: string;
  /** URL key, default "searchTerm" (the API's name). */
  param?: string;
  debounceMs?: number;
  className?: string;
}

/** Writes to the URL after the user stops typing and resets to page 1. Render under <Suspense>. */
export function SearchInput({ label, placeholder, param = "searchTerm", debounceMs = 400, className }: SearchInputProps) {
  const id = useId();
  const { get, set } = useUrlState();
  const urlValue = get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const debounced = useDebounce(value, debounceMs);
  const lastSynced = useRef(urlValue);

  // URL changed elsewhere (back button, "clear filters"): reflect it in the box.
  useEffect(() => {
    if (urlValue !== lastSynced.current) {
      lastSynced.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  useEffect(() => {
    const next = debounced.trim();
    if (next === lastSynced.current) return;
    lastSynced.current = next;
    set({ [param]: next || null });
  }, [debounced, param, set]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? label}
        maxLength={100}
        autoComplete="off"
        className="h-11 rounded-full bg-card pr-10 pl-10 shadow-card [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
