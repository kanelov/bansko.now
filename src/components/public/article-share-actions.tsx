"use client";

import { useMemo, useState } from "react";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type ArticleShareActionsProps = {
  title: string;
  url: string;
  locale?: Locale;
};

function shareButtonClass(variant: "solid" | "outline" = "outline") {
  return variant === "solid"
    ? "inline-flex rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
    : "inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-forest hover:text-[var(--forest)] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest";
}

export function ArticleShareActions({ title, url, locale = "bg" }: ArticleShareActionsProps) {
  const dictionary = getDictionary(locale);
  const [copied, setCopied] = useState(false);

  const socialLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return [
      {
        label: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      },
      {
        label: "X",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
      },
      {
        label: "LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      }
    ];
  }, [title, url]);

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title,
        url
      });
    } catch {
      // User cancellation should leave the UI unchanged.
    }
  }

  return (
    <nav className="mt-8 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-6" aria-label={dictionary.share}>
      <span className="mr-1 text-sm font-semibold uppercase text-moss">{dictionary.share}</span>
      <button type="button" onClick={nativeShare} className={shareButtonClass("solid")}>
        {dictionary.share}
      </button>
      {socialLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={shareButtonClass()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${dictionary.share}: ${link.label}`}
        >
          {link.label}
        </a>
      ))}
      <button type="button" onClick={copyLink} className={shareButtonClass()} aria-live="polite">
        {copied ? dictionary.copied : dictionary.copyLink}
      </button>
    </nav>
  );
}
