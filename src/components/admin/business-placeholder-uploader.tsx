"use client";

import { useState } from "react";
import { createPlaceholderUploadAction, finalizePlaceholderAction } from "@/app/admin/placeholder-actions";

type Row = { slug: string; label: string };

/** Десет полета: по една илюстрация на категория. Показва текущата и качва нова. */
export function BusinessPlaceholderUploader({ rows, baseUrl }: { rows: Row[]; baseUrl: string }) {
  const [stamp, setStamp] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  async function upload(slug: string, file: File | null) {
    if (!file) return;
    setStatus((current) => ({ ...current, [slug]: "Качва се…" }));
    try {
      const ticket = await createPlaceholderUploadAction({ slug, contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);
      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);
      setStatus((current) => ({ ...current, [slug]: "Обработва се…" }));
      const result = await finalizePlaceholderAction({ slug, key: ticket.key });
      if (!result.ok) throw new Error(result.error);
      setMissing((current) => ({ ...current, [slug]: false }));
      setStamp((current) => ({ ...current, [slug]: Date.now() }));
      setStatus((current) => ({ ...current, [slug]: "Готово" }));
    } catch (error) {
      setStatus((current) => ({ ...current, [slug]: error instanceof Error ? error.message : "Неуспешно качване." }));
    }
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const src = `${baseUrl}/placeholder-${row.slug}.webp${stamp[row.slug] ? `?v=${stamp[row.slug]}` : ""}`;
        return (
          <li key={row.slug} className="grid gap-2 rounded-2xl border border-[var(--admin-line)] bg-white p-3 text-stone-950">
            <div className="relative overflow-hidden rounded-xl bg-[var(--admin-panel)]" style={{ aspectRatio: "3 / 2" }}>
              {missing[row.slug] ? (
                <span className="absolute inset-0 grid place-items-center text-xs text-[var(--admin-muted)]">няма качена</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" onError={() => setMissing((current) => ({ ...current, [row.slug]: true }))} />
              )}
            </div>
            <p className="text-sm font-semibold">{row.label}</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                void upload(row.slug, event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              className="text-xs"
            />
            {status[row.slug] ? <p className="text-xs text-[var(--admin-muted)]">{status[row.slug]}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
