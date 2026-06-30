import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { parseFaqItems, parseGalleryImages, parseVideoBlock, splitMarkdownBlocks } from "@/lib/markdown-blocks";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-12 font-serif text-3xl font-semibold leading-tight text-stone-950">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 font-serif text-3xl font-semibold leading-tight text-stone-950">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-8 text-xl font-semibold text-stone-950">{children}</h3>,
  p: ({ children }) => <p className="mt-5 text-lg leading-8 text-stone-700">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className="font-semibold text-forest underline decoration-sage underline-offset-4">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mt-5 grid list-disc gap-2 pl-6 text-lg leading-8 text-stone-700">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 grid list-decimal gap-2 pl-6 text-lg leading-8 text-stone-700">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="mt-8 border-l-4 border-clay bg-stone-50 py-4 pl-6 pr-4 font-serif text-2xl leading-9 text-stone-800">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-stone-950">{children}</strong>,
  hr: () => <hr className="my-10 border-stone-200" />,
  table: ({ children }) => (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200">
      <table className="w-full border-collapse bg-white text-left text-sm text-stone-700">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-stone-200 bg-stone-50 px-4 py-3 font-semibold text-stone-950">{children}</th>,
  td: ({ children }) => <td className="border-b border-stone-100 px-4 py-3">{children}</td>,
  img: ({ src, alt }) => (
    <figure className="mt-8">
      <img src={src || ""} alt={alt || ""} className="aspect-[16/10] w-full rounded-2xl object-cover" loading="lazy" />
      {alt ? <figcaption className="mt-3 text-sm leading-6 text-stone-500">{alt}</figcaption> : null}
    </figure>
  )
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = splitMarkdownBlocks(content);

  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        if (block.type === "gallery") {
          return <GalleryLightbox key={`gallery-${index}`} images={parseGalleryImages(block.content)} />;
        }

        if (block.type === "callout") {
          return (
            <aside key={`callout-${index}`} className="not-prose mt-10 rounded-3xl border border-sage bg-sage/40 p-6 text-lg leading-8 text-forest">
              <MarkdownBlock content={block.content} />
            </aside>
          );
        }

        if (block.type === "faq") {
          const items = parseFaqItems(block.content);

          return (
            <section key={`faq-${index}`} className="not-prose mt-12 rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
              <h2 className="font-serif text-3xl font-semibold text-stone-950">Често задавани въпроси</h2>
              <div className="mt-5 grid gap-3">
                {items.map((item) => (
                  <details key={item.question} className="rounded-2xl bg-paper p-4">
                    <summary className="cursor-pointer text-base font-semibold text-stone-950">{item.question}</summary>
                    <div className="mt-3 text-sm leading-6 text-stone-700">
                      <MarkdownBlock content={item.answer} />
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

        return <MarkdownBlock key={`markdown-${index}`} content={block.content} />;
      })}
    </div>
  );
}
