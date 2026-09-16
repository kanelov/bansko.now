"use client";

import { useState } from "react";
import { createBusinessVideoUploadAction, deleteBusinessVideoAction, finalizeBusinessVideoAction } from "@/app/admin/business-media-actions";

type Video = { id: string; url: string | null; alt: string | null; createdAt: string };

/**
 * Видеа за екраните на един бизнес (админ). MP4 до 150 MB отива направо в R2
 * с подписан адрес; собственикът после го избира в портала при „Меню + видео“.
 */
export function BusinessVideoUploader({ businessId, initial }: { businessId: string; initial: Video[] }) {
  const [videos, setVideos] = useState(initial);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus({ kind: "busy", text: `Качва се ${file.name}…` });

    try {
      const ticket = await createBusinessVideoUploadAction({ businessId, contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);

      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

      setStatus({ kind: "busy", text: "Записва се…" });
      const result = await finalizeBusinessVideoAction({ businessId, key: ticket.key, alt: file.name.replace(/\.[^.]+$/, "") });
      if (!result.ok) throw new Error(result.error);

      setVideos((current) => [{ id: result.id, url: result.url, alt: null, createdAt: new Date().toISOString() }, ...current]);
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Да изтрия ли видеото? Екраните, които го ползват, ще останат без видео.")) return;
    setStatus({ kind: "busy", text: "Изтрива се…" });
    const result = await deleteBusinessVideoAction({ businessId, id });
    if (result.ok) {
      setVideos((current) => current.filter((video) => video.id !== id));
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", text: result.error ?? "Изтриването не успя." });
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-5 text-stone-950">
      <div>
        <p className="text-sm font-semibold">Видеа за екраните (телевизорите)</p>
        <p className="mt-1 text-xs text-[var(--admin-muted)]">
          MP4 (H.264 + AAC), 1080p, до 60 секунди, до 150 MB. Върти се в цикъл без звук на 30 % от екрана. Собственикът го
          избира в портала при шаблон „Меню + видео“.
        </p>
      </div>

      {videos.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {videos.map((video) => (
            <li key={video.id} className="grid gap-1">
              <video src={video.url ?? undefined} muted playsInline preload="metadata" controls className="aspect-video w-full rounded-xl bg-black object-cover" />
              <div className="flex items-center justify-between text-xs text-[var(--admin-muted)]">
                <span>{video.alt ?? new Date(video.createdAt).toLocaleDateString("bg-BG")}</span>
                <button type="button" onClick={() => remove(video.id)} disabled={status.kind === "busy"} className="font-semibold text-red-700">
                  Изтрий
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">Още няма качено видео.</p>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-semibold">Качи MP4</span>
        <input
          type="file"
          accept="video/mp4"
          disabled={status.kind === "busy"}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      {status.kind === "busy" ? <p className="text-sm text-[var(--admin-muted)]">{status.text}</p> : null}
      {status.kind === "error" ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
