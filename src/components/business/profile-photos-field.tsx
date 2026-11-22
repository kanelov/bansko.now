"use client";

import { useState } from "react";
import {
  createProfilePhotoUploadAction,
  finalizeProfilePhotoAction,
  makeMainProfilePhotoAction,
  removeProfilePhotoAction
} from "@/app/business/profile/actions";
import { portalUi } from "@/components/business/ui";

/**
 * Снимките на профила. Първата е главната (картата в каталога и горе в
 * страницата). Качването е направо в R2 (без лимита на Vercel), после сървърът
 * прави размерите. Всяко действие се записва веднага.
 */
export function ProfilePhotosField({ initial }: { initial: string[] }) {
  const [images, setImages] = useState(initial);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });
  const busy = status.kind === "busy";

  async function run(label: string, action: () => Promise<{ ok: true; images: string[] } | { ok: false; error: string }>) {
    setStatus({ kind: "busy", text: label });
    const result = await action();
    if (result.ok) {
      setImages(result.images);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", text: result.error });
    }
  }

  async function upload(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      setStatus({ kind: "busy", text: "Качва се…" });
      const ticket = await createProfilePhotoUploadAction({ contentType: file.type, bytes: file.size });
      if (!ticket.ok) {
        setStatus({ kind: "error", text: ticket.error });
        return;
      }
      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) {
        setStatus({ kind: "error", text: `Качването не успя (${put.status}).` });
        return;
      }
      await run("Обработва се…", () => finalizeProfilePhotoAction({ key: ticket.key }));
    }
  }

  return (
    <div className="grid gap-3">
      {images.length === 0 ? (
        <p className="text-sm text-stone-650">Още няма снимки. Докато няма, страницата показва общата илюстрация на категорията.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => (
            <li key={url} className="grid gap-1">
              <div className="relative overflow-hidden rounded-xl bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-forest px-2 py-0.5 text-[11px] font-semibold text-white">главна</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {index > 0 ? (
                  <button type="button" disabled={busy} onClick={() => run("Записва се…", () => makeMainProfilePhotoAction({ url }))} className={portalUi.smallButton}>
                    Направи главна
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Да махна ли тази снимка от профила?")) void run("Маха се…", () => removeProfilePhotoAction({ url }));
                  }}
                  className={portalUi.smallButton}
                >
                  Махни
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-semibold">Качи снимки</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <span className={portalUi.hint}>JPEG, PNG или WebP до 8 MB. Най-добре хоризонтални, поне 1600 px широки. До 12 снимки.</span>
      </label>

      {status.kind === "busy" ? <p className="text-sm text-stone-650">{status.text}</p> : null}
      {status.kind === "error" ? (
        <p className="text-sm text-clay" role="alert">
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
