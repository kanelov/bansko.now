"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  href: string;
};

export function SiteSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(data.results ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <>
      <button
        type="button"
        aria-label="Търсене"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={
          compact
            ? "group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-stone-700 transition hover:bg-forest hover:text-white"
            : "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white/70 text-forest shadow-soft transition hover:border-forest hover:bg-forest hover:text-white"
        }
      >
        <IconGlyph name="magnifying-glass" className="h-4 w-4 text-current transition group-hover:text-white" />
        {compact ? <span className="transition group-hover:text-white">Търсене</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-stone-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Търсене в сайта">
          <div className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-paper shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
              <IconGlyph name="magnifying-glass" className="h-4 w-4 shrink-0 text-forest" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setOpen(false);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent py-2 text-base font-semibold text-stone-950 outline-none placeholder:text-stone-400"
                placeholder="Търси статии, бизнеси, категории..."
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-forest hover:text-white"
              >
                Затвори
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {query.trim().length < 2 ? (
                <p className="rounded-2xl bg-white p-5 text-sm leading-6 text-stone-650">Въведи поне 2 символа, за да потърсиш в сайта.</p>
              ) : loading ? (
                <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-stone-650">Търсене...</p>
              ) : results.length ? (
                <div className="grid gap-2">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href as Route}
                      onClick={() => setOpen(false)}
                      className="group rounded-2xl bg-white p-4 text-left transition hover:bg-forest hover:text-white"
                    >
                      <span className="text-xs font-semibold uppercase text-moss group-hover:text-white">{result.type}</span>
                      <h2 className="mt-1 font-serif text-xl font-semibold">{result.title}</h2>
                      {result.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 opacity-80">{result.description}</p> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-white p-5 text-sm leading-6 text-stone-650">Няма резултати за това търсене.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
