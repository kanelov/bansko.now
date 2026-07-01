"use client";

import { useEffect, useMemo, useState } from "react";

type ArticleShareActionsProps = {
  title: string;
  url: string;
};

function shareButtonClass(variant: "solid" | "outline" = "outline") {
  return variant === "solid"
    ? "inline-flex rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
    : "inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-forest hover:text-[var(--forest)] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest";
}

export function ArticleShareActions({ title, url }: ArticleShareActionsProps) {
  const [shareUrl, setShareUrl] = useState(url);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href || url);
    setCanNativeShare(typeof navigator.share === "function");
  }, [url]);

  const socialLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
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
  }, [shareUrl, title]);

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
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
      return;
    }

    try {
      await navigator.share({
        title,
        url: shareUrl
      });
    } catch {
      // User cancellation should leave the UI unchanged.
    }
  }

  return (
    <nav className="mt-8 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-6" aria-label="Споделяне на статията">
      <span className="mr-1 text-sm font-semibold uppercase text-moss">Сподели</span>
      {canNativeShare ? (
        <button type="button" onClick={nativeShare} className={shareButtonClass("solid")}>
          Сподели
        </button>
      ) : null}
      {socialLinks.map((link) => (
        <a key={link.label} href={link.href} className={shareButtonClass()} target="_blank" rel="noopener noreferrer" aria-label={`Сподели в ${link.label}`}>
          {link.label}
        </a>
      ))}
      <button type="button" onClick={copyLink} className={shareButtonClass()} aria-live="polite">
        {copied ? "Копирано" : "Копирай линк"}
      </button>
    </nav>
  );
}
