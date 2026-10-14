import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { cn } from "../../lib/utils";

export interface ComboboxOption {
  value: string;
  label?: string;
  hint?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Text for the "create new" row, e.g. (q) => `Create artist "${q}"`. */
  createLabel?: (query: string) => string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Autocomplete combobox in the shadcn style (button trigger + cmdk-powered
 * filterable list). Typing a name that doesn't exist offers a "create" row
 * when allowCustom is set, so picking existing artists/albums stays
 * consistent while new ones can still be added inline.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  createLabel = (q) => `Create "${q}"`,
  allowCustom = true,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Each open starts searching from the current value.
  useEffect(() => {
    if (open) setQuery(value);
  }, [open, value]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => (o.label ?? o.value).toLowerCase().includes(q))
    : options;
  const exactMatch = options.some(
    (o) => (o.label ?? o.value).toLowerCase() === query.trim().toLowerCase(),
  );
  const showCreate = allowCustom && query.trim() !== "" && !exactMatch;

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm outline-none transition-colors focus:border-rose-500 disabled:opacity-50"
      >
        <span className={cn("truncate", value ? "text-zinc-100" : "text-zinc-500")}>
          {value || placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
          <Command
            label={searchPlaceholder}
            shouldFilter={false}
            className="flex flex-col"
          >
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              className="border-b border-zinc-800 bg-transparent px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <Command.List className="max-h-48 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-2 text-xs text-zinc-500">
                {showCreate ? "Press Enter to create it" : "No matches found"}
              </Command.Empty>
              {filtered.map((o) => {
                const label = o.label ?? o.value;
                const selected = value === o.value;
                return (
                  <Command.Item
                    key={o.value}
                    value={o.value}
                    onSelect={() => select(o.value)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-zinc-200 transition data-[selected=true]:bg-zinc-800"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={cn("shrink-0", selected ? "text-rose-400" : "text-transparent")}
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {o.hint && (
                      <span className="shrink-0 text-[11px] text-zinc-500">{o.hint}</span>
                    )}
                  </Command.Item>
                );
              })}
              {showCreate && (
                <Command.Item
                  value={`__create:${query.trim()}`}
                  onSelect={() => select(query.trim())}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-rose-400 transition data-[selected=true]:bg-zinc-800"
                >
                  <span className="w-[13px] shrink-0 text-center">+</span>
                  <span className="min-w-0 flex-1 truncate">
                    {createLabel(query.trim())}
                  </span>
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
