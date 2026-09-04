"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { name: string; status: "uploading" | "processing" | "done" | "error"; message?: string };

/**
 * Sends each master straight to R2 with a presigned URL, then asks the server to build the
 * derivatives. Large files never pass through the Vercel function.
 */
export function PhotoUploader() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const list = [...files];
    setResults(list.map((file) => ({ name: file.name, status: "uploading" })));

    for (const [index, file] of list.entries()) {
      const update = (status: Result["status"], message?: string) =>
        setResults((current) => current.map((item, position) => (position === index ? { ...item, status, message } : item)));
      try {
        const ticket = await fetch("/api/admin/photos/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        if (!ticket.ok) throw new Error((await ticket.json().catch(() => ({}))).error || "Неуспешна заявка за качване.");
        const { key, url } = (await ticket.json()) as { key: string; url: string };

        const put = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

        update("processing");
        const processed = await fetch("/api/admin/photos/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, filename: file.name })
        });
        if (!processed.ok) throw new Error((await processed.json().catch(() => ({}))).error || "Обработката не успя.");
        update("done");
      } catch (error) {
        update("error", error instanceof Error ? error.message : "Неуспешно качване.");
      }
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <section className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Качи фотографии</h2>
        <p className="mt-1 text-sm text-stone-600">
          Готови JPEG файлове от Lightroom. Файлът отива директно в R2, после системата прави размерите за сайта и файловете за лиценз.
          Оригиналът с висока резолюция се пази за разширения лиценз.
        </p>
      </div>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/tiff"
        disabled={busy}
        onChange={(event) => handleFiles(event.target.files)}
        className="block w-full rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-3 text-sm text-stone-700 file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {results.length ? (
        <ul className="grid gap-1 text-sm">
          {results.map((result) => (
            <li key={result.name} className="flex items-center justify-between gap-3">
              <span className="truncate text-stone-700">{result.name}</span>
              <span className={result.status === "error" ? "text-red-700" : result.status === "done" ? "text-emerald-700" : "text-stone-500"}>
                {result.status === "uploading" ? "качва се…" : result.status === "processing" ? "обработва се…" : result.status === "done" ? "готово" : result.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
