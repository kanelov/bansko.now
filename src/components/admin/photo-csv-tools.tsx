"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImportResult = { updated: number; problems: string[] } | { error: string } | null;

/** Download the photo fields as CSV, fill them in elsewhere, then send the file back. */
export function PhotoCsvTools() {
  const router = useRouter();
  const [result, setResult] = useState<ImportResult>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const response = await fetch("/api/admin/photos/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text
      });
      const data = (await response.json()) as ImportResult;
      setResult(data);
      router.refresh();
    } catch {
      setResult({ error: "Файлът не можа да бъде изпратен." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Износ и внос на данните</h2>
        <p className="mt-1 text-sm text-stone-600">
          Свали таблицата с полетата на всички снимки, попълни заглавия, описания, alt текстове, тагове и SEO данни на двата езика,
          после върни файла тук. Редовете се разпознават по кода на снимката, а празните клетки остават непроменени.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.assign("/api/admin/photos/export")}
          className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold"
        >
          Свали CSV
        </button>
        <label className="text-sm font-semibold text-stone-700">
          <span className="mr-2">Върни попълнения файл:</span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="text-sm file:mr-2 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </label>
        {busy ? <span className="text-sm text-stone-500">внася се…</span> : null}
      </div>
      {result && "error" in result ? (
        <p className="rounded-xl border border-red-300 bg-red-100 p-3 text-sm text-red-900">{result.error}</p>
      ) : null}
      {result && "updated" in result ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Обновени фотографии: {result.updated}</p>
          {result.problems.length ? (
            <ul className="mt-1 grid gap-0.5 text-emerald-900/80">
              {result.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
