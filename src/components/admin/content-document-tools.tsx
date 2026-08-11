"use client";

import { useRef, useState } from "react";
import { IconGlyph } from "@/components/public/icon-glyph";
import {
  buildContentDocument,
  getOppositeLocale,
  parseContentDocument,
  prepareTranslationValues,
  safeDocumentFileName,
  type ContentDocumentMetadata,
  type ContentDocumentType,
  type ContentDocumentValue
} from "@/lib/content-transfer";
import type { Locale } from "@/lib/types";

type ImportMessage = { kind: "success" | "error"; text: string } | null;

function readFormValues(form: HTMLFormElement, fieldNames: readonly string[]) {
  const values: Record<string, ContentDocumentValue> = {};

  for (const name of fieldNames) {
    const control = form.elements.namedItem(name);

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      values[name] = control.checked;
    } else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
      values[name] = control.value;
    }
  }

  return values;
}

function applyFieldsToForm(form: HTMLFormElement, fields: Record<string, string>, fieldNames: readonly string[]) {
  let importedCount = 0;

  for (const name of fieldNames) {
    if (!(name in fields)) {
      continue;
    }

    const control = form.elements.namedItem(name);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) {
      continue;
    }

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = fields[name].trim().toLowerCase() === "true";
    } else {
      control.value = fields[name];
    }

    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    importedCount += 1;
  }

  return importedCount;
}

export function ContentDocumentTools({
  documentType,
  currentLocale,
  translationGroupId,
  recordId,
  slug,
  fieldNames,
  values,
  onImport
}: {
  documentType: ContentDocumentType;
  currentLocale: Locale;
  translationGroupId?: string;
  recordId?: string;
  slug?: string;
  fieldNames: readonly string[];
  values?: Record<string, ContentDocumentValue>;
  onImport?: (fields: Record<string, string>, metadata: ContentDocumentMetadata) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<ImportMessage>(null);
  const targetLocale = getOppositeLocale(currentLocale);

  function getCurrentValues() {
    if (values) {
      return values;
    }

    const form = containerRef.current?.closest("form");
    if (!form) {
      throw new Error("Формата не е намерена.");
    }

    return readFormValues(form, fieldNames);
  }

  function exportDocument() {
    try {
      const currentValues = getCurrentValues();
      const groupId = translationGroupId || String(currentValues.translation_group_id || "");
      const translationValues = prepareTranslationValues(currentValues, targetLocale, groupId);
      const content = buildContentDocument({
        documentType,
        sourceLocale: currentLocale,
        targetLocale,
        translationGroupId: groupId,
        recordId,
        fields: translationValues,
        fieldNames
      });
      const fileSlug = safeDocumentFileName(slug || String(currentValues.slug || currentValues.title || documentType));
      const blobUrl = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `bansko-now-${documentType}-${fileSlug}-${targetLocale}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      setMessage({
        kind: "success",
        text: `Експортът за ${targetLocale.toUpperCase()} е готов. Дай целия файл на AI и не позволявай промяна на BANSKO_NOW_FIELD маркерите.`
      });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Експортът не беше създаден." });
    }
  }

  async function importDocument(file: File) {
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Документът е по-голям от 5 MB.");
      }

      const parsed = parseContentDocument(await file.text());
      if (parsed.metadata.documentType !== documentType) {
        throw new Error(`Този файл е за ${parsed.metadata.documentType === "article" ? "статия" : "страница"}, а не за текущата форма.`);
      }
      if (parsed.metadata.targetLocale !== currentLocale) {
        throw new Error(`Документът е подготвен за ${parsed.metadata.targetLocale.toUpperCase()}. Отвори тази езикова версия и импортирай файла там.`);
      }
      if (translationGroupId && parsed.metadata.translationGroupId && parsed.metadata.translationGroupId !== translationGroupId) {
        throw new Error("Документът принадлежи към друга статия или страница. Отвори правилната езикова версия.");
      }

      const requiredFields = documentType === "article" ? ["title", "slug", "content"] : ["title", "slug"];
      const missingRequired = requiredFields.filter((name) => !(name in parsed.fields));
      if (missingRequired.length) {
        throw new Error(`Липсват задължителни полета: ${missingRequired.join(", ")}.`);
      }

      const safeFields = { ...parsed.fields, status: "draft" };
      if (onImport) {
        onImport(safeFields, parsed.metadata);
      } else {
        const form = containerRef.current?.closest("form");
        if (!form) {
          throw new Error("Формата не е намерена.");
        }
        applyFieldsToForm(form, safeFields, fieldNames);
      }

      const importedCount = fieldNames.filter((name) => name in parsed.fields).length;
      const missingCount = fieldNames.length - importedCount;
      setMessage({
        kind: "success",
        text: `Импортирани са ${importedCount} полета${missingCount ? `; ${missingCount} липсващи полета са оставени без промяна` : ""}. Прегледай и запази като чернова.`
      });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Документът не можа да бъде импортиран." });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div ref={containerRef} className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-100 p-4 text-stone-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold">AI превод чрез документ</p>
          <p className="mt-1 text-xs leading-5 text-stone-600">
            Експортът подготвя всички полета за {targetLocale.toUpperCase()}. Импортът попълва текущата {currentLocale.toUpperCase()} версия от преведения Markdown файл, без автоматично записване или публикуване.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportDocument} className="admin-button admin-button-forest gap-2 px-4 py-2 text-xs font-semibold">
            <IconGlyph name="file-export" className="h-4 w-4" />
            Експорт за {targetLocale.toUpperCase()}
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="admin-button admin-button-sage gap-2 px-4 py-2 text-xs font-semibold">
            <IconGlyph name="file-import" className="h-4 w-4" />
            Импорт на превод
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void importDocument(file);
              }
            }}
          />
        </div>
      </div>
      {message ? (
        <p role="status" className={`rounded-xl px-3 py-2 text-xs font-semibold ${message.kind === "success" ? "bg-sage/50 text-forest" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
