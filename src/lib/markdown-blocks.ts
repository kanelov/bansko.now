export type MarkdownBlock =
  | { type: "markdown"; content: string }
  | { type: "text"; content: string }
  | { type: "gallery"; content: string }
  | { type: "callout"; content: string }
  | { type: "faq"; content: string }
  | { type: "video"; content: string }
  | { type: "button"; content: string };

export type GalleryImage = {
  src: string;
  alt: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type MarkdownButton = {
  label: string;
  url: string;
  style: "primary" | "secondary";
};

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type MarkdownTextColor = "stone" | "forest" | "moss" | "clay" | "ink" | "white";

const blockPattern = /:::([a-z]+)\n([\s\S]*?)\n:::/g;
const supportedBlocks = new Set(["text", "gallery", "callout", "faq", "video", "button"]);
const textColors = new Set<MarkdownTextColor>(["stone", "forest", "moss", "clay", "ink", "white"]);

export function splitMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(content))) {
    const type = match[1];
    const before = content.slice(cursor, match.index);

    if (before.trim()) {
      blocks.push({ type: "markdown", content: before });
    }

    if (supportedBlocks.has(type)) {
      blocks.push({ type: type as "text" | "gallery" | "callout" | "faq" | "video" | "button", content: match[2].trim() });
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

export function parseTextBlockOptions(content: string, fallbackColor: MarkdownTextColor = "stone") {
  const lines = content.split("\n");
  let color = fallbackColor;
  let cursor = 0;

  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    const match = line.match(/^(color|text-color|text_color):\s*([a-z]+)$/i);

    if (!line) {
      cursor += 1;
      break;
    }

    if (!match) {
      break;
    }

    const nextColor = match[2].toLowerCase() as MarkdownTextColor;
    if (textColors.has(nextColor)) {
      color = nextColor;
    }

    cursor += 1;
  }

  const body = lines.slice(cursor).join("\n").trim();

  return {
    body: body || content.trim(),
    color
  };
}

export function parseButtonBlock(content: string): MarkdownButton | null {
  const values = Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        return separator > -1 ? [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()] : ["", ""];
      })
      .filter(([key]) => key)
  );
  const markdownLink = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const label = values.text || values.label || markdownLink?.[1]?.trim();
  const url = values.url || values.href || markdownLink?.[2]?.trim();
  const style = values.style === "secondary" ? "secondary" : "primary";

  if (!label || !url) {
    return null;
  }

  return { label, url, style };
}

export function getHeadingId(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stripCustomBlocks(content: string) {
  return content.replace(blockPattern, "");
}

function cleanHeadingText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .trim();
}

export function getArticleToc(content: string): TocItem[] {
  return Array.from(stripCustomBlocks(content).matchAll(/^(##|###)\s+(.+)$/gm))
    .map((match) => {
      const text = cleanHeadingText(match[2]);
      return {
        id: getHeadingId(text),
        text,
        level: match[1] === "###" ? 3 : 2
      };
    })
    .filter((item) => item.id && item.text) as TocItem[];
}
