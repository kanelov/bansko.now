import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import {
  getHeadingId,
  parseButtonBlock,
  parseFaqItems,
  parseGalleryImages,
  parseTextBlockOptions,
  parseVideoBlock,
  splitMarkdownBlocks,
  type MarkdownTextColor
} from "@/lib/markdown-blocks";

const textColorClasses: Record<MarkdownTextColor, string> = {
  stone: "text-stone-700",
  forest: "text-forest",
  moss: "text-moss",
  clay: "text-clay",
  ink: "text-stone-950",
  white: "text-white"
};

const headingColorClasses: Record<MarkdownTextColor, string> = {
  stone: "text-stone-950",
  forest: "text-forest",
  moss: "text-moss",
  clay: "text-clay",
  ink: "text-stone-950",
  white: "text-white"
};

function childrenToText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(childrenToText).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return childrenToText((children as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
}

function createComponents(textColor: MarkdownTextColor = "stone"): Components {
  const bodyText = textColorClasses[textColor];
  const headingText = headingColorClasses[textColor];

  return {
    h1: ({ children }) => (
      <h2 id={getHeadingId(childrenToText(children))} className={`mt-12 scroll-mt-28 font-serif text-3xl font-semibold leading-tight ${headingText}`}>
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2 id={getHeadingId(childrenToText(children))} className={`mt-12 scroll-mt-28 font-serif text-3xl font-semibold leading-tight ${headingText}`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 id={getHeadingId(childrenToText(children))} className={`mt-8 scroll-mt-28 text-xl font-semibold ${headingText}`}>
        {children}
      </h3>
    ),
    p: ({ children }) => <p className={`mt-5 text-lg leading-8 ${bodyText}`}>{children}</p>,
    a: ({ href, children }) => (
      <a href={href} className="font-semibold text-forest underline decoration-sage underline-offset-4">
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className={`mt-5 grid list-disc gap-2 pl-6 text-lg leading-8 ${bodyText}`}>{children}</ul>,
    ol: ({ children }) => <ol className={`mt-5 grid list-decimal gap-2 pl-6 text-lg leading-8 ${bodyText}`}>{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className={`mt-8 border-l-4 border-clay bg-stone-50 py-4 pl-6 pr-4 font-serif text-2xl leading-9 ${bodyText}`}>
        {children}
      </blockquote>
    ),
    strong: ({ children }) => <strong className={`font-semibold ${headingText}`}>{children}</strong>,
    hr: () => <hr className="my-10 border-stone-200" />,
    table: ({ children }) => (
      <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200">
        <table className="w-full border-collapse bg-white text-left text-sm text-stone-700">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-stone-200 bg-stone-50 px-4 py-3 font-semibold text-stone-950">{children}</th>,
    td: ({ children }) => <td className="border-b border-stone-100 px-4 py-3">{children}</td>,
    img: ({ src, alt }) => (
      <figure className="mt-8" itemScope itemType="https://schema.org/ImageObject">
        <img
          src={src || ""}
          alt={alt || ""}
          className="aspect-[16/10] w-full rounded-[1.4rem] object-cover"
          loading="lazy"
          decoding="async"
          itemProp="contentUrl"
        />
        {alt ? (
          <figcaption className="mt-3 text-sm leading-6 text-stone-500" itemProp="caption">
            {alt}
          </figcaption>
        ) : null}
      </figure>
    )
  };
}

function MarkdownBlock({ content, textColor = "stone" }: { content: string; textColor?: MarkdownTextColor }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={createComponents(textColor)}>
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = splitMarkdownBlocks(content);

  return (
    <div className="article-body flow-root">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          const textBlock = parseTextBlockOptions(block.content);

          return (
            <section key={`text-${index}`} className="not-prose mt-8 rounded-3xl border border-stone-200 bg-white/70 p-6">
              <MarkdownBlock content={textBlock.body} textColor={textBlock.color} />
            </section>
          );
        }

        if (block.type === "gallery") {
          return <GalleryLightbox key={`gallery-${index}`} images={parseGalleryImages(block.content)} />;
        }

        if (block.type === "callout") {
          const callout = parseTextBlockOptions(block.content, "forest");

          return (
            <aside key={`callout-${index}`} className="not-prose mt-10 rounded-3xl border border-sage bg-sage/40 p-6">
              <MarkdownBlock content={callout.body} textColor={callout.color} />
            </aside>
          );
        }

        if (block.type === "faq") {
          const faq = parseTextBlockOptions(block.content);
          const items = parseFaqItems(faq.body);

          return (
            <section key={`faq-${index}`} className="not-prose mt-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
              <h2 className={`font-serif text-3xl font-semibold ${headingColorClasses[faq.color]}`}>Често задавани въпроси</h2>
              <div className="mt-5 grid gap-3">
                {items.map((item) => (
                  <details key={item.question} className="rounded-2xl bg-paper p-4">
                    <summary className={`cursor-pointer text-base font-semibold ${headingColorClasses[faq.color]}`}>{item.question}</summary>
                    <div className={`mt-3 text-sm leading-6 ${textColorClasses[faq.color]}`}>
                      <MarkdownBlock content={item.answer} textColor={faq.color} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "video") {
          const video = parseVideoBlock(block.content);

          return video.url ? (
            <figure key={`video-${index}`} className="not-prose mt-10 overflow-hidden rounded-3xl bg-stone-950 text-white shadow-soft">
              <video src={video.url} className="aspect-video w-full object-cover" controls preload="metadata" />
              {video.caption ? <figcaption className="px-5 py-4 text-sm leading-6 text-stone-200">{video.caption}</figcaption> : null}
            </figure>
          ) : null;
        }

        if (block.type === "button") {
          const button = parseButtonBlock(block.content);

          if (!button) {
            return null;
          }

          const isExternal = /^https?:\/\//i.test(button.url);
          const className =
            button.style === "secondary"
              ? "inline-flex rounded-full border border-forest bg-white px-6 py-3 text-sm font-semibold text-[var(--forest)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-forest hover:text-white hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
              : "inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest";

          return (
            <div key={`button-${index}`} className="not-prose mt-8">
              <a href={button.url} className={className} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
                {button.label}
              </a>
            </div>
          );
        }

        return <MarkdownBlock key={`markdown-${index}`} content={block.content} />;
      })}
    </div>
  );
}
