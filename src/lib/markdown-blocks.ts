export type MarkdownBlock =
  | { type: "markdown"; content: string }
  | { type: "gallery"; content: string }
  | { type: "callout"; content: string }
  | { type: "faq"; content: string }
  | { type: "video"; content: string };

export type GalleryImage = {
  src: string;
  alt: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

const supportedBlocks = new Set(["gallery", "callout", "faq", "video"]);

export function splitMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const blockPattern = /:::([a-z]+)\n([\s\S]*?)\n:::/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(content))) {
    const type = match[1];
    const before = content.slice(cursor, match.index);

    if (before.trim()) {
      blocks.push({ type: "markdown", content: before });
    }

    if (supportedBlocks.has(type)) {
      blocks.push({ type: type as "gallery" | "callout" | "faq" | "video", content: match[2].trim() });
    } else {
      blocks.push({ type: "markdown", content: match[0] });
    }

    cursor = match.index + match[0].length;
  }

  const rest = content.slice(cursor);
  if (rest.trim()) {
    blocks.push({ type: "markdown", content: rest });
  }

  return blocks.length ? blocks : [{ type: "markdown", content }];
}

export function parseGalleryImages(content: string): GalleryImage[] {
  return Array.from(content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g))
    .map((match) => ({
      alt: match[1].trim(),
      src: match[2].trim()
    }))
    .filter((image) => image.src);
}

export function parseFaqItems(content: string): FaqItem[] {
  return content
    .split(/^###\s+/gm)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const [question, ...answerLines] = section.split("\n");
      return {
        question: question.trim(),
        answer: answerLines.join("\n").trim()
      };
    })
    .filter((item) => item.question && item.answer);
}

export function getFaqItemsFromMarkdown(content: string): FaqItem[] {
  return splitMarkdownBlocks(content)
    .filter((block): block is { type: "faq"; content: string } => block.type === "faq")
    .flatMap((block) => parseFaqItems(block.content));
}

export function parseVideoBlock(content: string) {
  const [urlLine, ...captionLines] = content.split("\n");
  return {
    url: urlLine.trim(),
    caption: captionLines.join("\n").trim()
  };
}
