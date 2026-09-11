import type { ArticleFallbackImage, Locale } from "@/lib/types";

/**
 * Default images for articles without a featured image.
 *
 * The owner keeps a small pool of his own pictures, each with keywords („планина, Пирин, връх“).
 * For an article without a picture the closest one is chosen by comparing those keywords with the
 * article title, category, tags, excerpt and text. Nothing is stored on the article: the choice is
 * made when the page renders, so a custom picture set later always wins, and a changed pool changes
 * every article that relies on it.
 *
 * Pure functions only: the article editor runs the same matcher in the browser to preview the choice.
 */

/** The article fields the matcher looks at. Every one is optional so a half written draft works too. */
export type FallbackImageSubject = {
  id?: string | null;
  slug?: string | null;
  locale?: Locale | string | null;
  title?: string | null;
  excerpt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  content?: string | null;
  categoryName?: string | null;
  tags?: string[] | null;
};

export type FallbackImageScore = {
  image: ArticleFallbackImage;
  score: number;
  /** The keywords that matched, for the admin test tool and the editor hint. */
  matched: string[];
};

function words(text: string | null | undefined) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** "планина" also finds "планината" and "планински": short words match exactly, longer ones by stem. */
function stem(word: string) {
  return word.length <= 4 ? word : word.slice(0, Math.max(4, word.length - 2));
}

/** Splits the admin input („залез, планина; sunset“) into clean lowercase keywords. */
export function parseFallbackKeywords(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : String(value ?? "");
  const seen = new Set<string>();
  for (const part of raw.split(/[,\n;]+/)) {
    const keyword = words(part).join(" ");
    if (keyword) seen.add(keyword);
  }
  return Array.from(seen);
}

/** A multi word keyword („залез планина“) matches when every word of it is present. */
function keywordMatches(keywordWords: string[], fieldWords: string[]) {
  return keywordWords.every((keyword) => {
    const prefix = stem(keyword);
    return fieldWords.some((word) => word.startsWith(prefix));
  });
}

/**
 * Scores every active image against the article, best first.
 * A keyword shared by several images („Банско“ on all of them) weighs proportionally less,
 * so the pictures are told apart by what is specific to each of them.
 */
export function scoreFallbackImages(images: ArticleFallbackImage[], subject: FallbackImageSubject): FallbackImageScore[] {
  const active = images.filter((image) => image.is_active !== false && image.image_url);
  const fields = [
    { words: words(subject.title), weight: 4 },
    { words: words(subject.categoryName), weight: 3 },
    { words: words((subject.tags ?? []).join(" ")), weight: 3 },
    { words: words(subject.excerpt), weight: 2 },
    { words: words(`${subject.seo_title ?? ""} ${subject.seo_description ?? ""}`), weight: 1 },
    { words: words(subject.content), weight: 1 }
  ].filter((field) => field.words.length);

  const keywordSets = active.map((image) => parseFallbackKeywords(image.keywords).map((keyword) => words(keyword)));
  const sharedBy = new Map<string, number>();
  for (const set of keywordSets) {
    for (const key of new Set(set.map((keyword) => keyword.join(" ")))) {
      sharedBy.set(key, (sharedBy.get(key) ?? 0) + 1);
    }
  }

  return active
    .map((image, index) => {
      let score = 0;
      const matched: string[] = [];
      for (const keyword of keywordSets[index]) {
        const key = keyword.join(" ");
        let keywordScore = 0;
        for (const field of fields) {
          if (keywordMatches(keyword, field.words)) keywordScore += field.weight;
        }
        if (keywordScore) {
          score += keywordScore / (sharedBy.get(key) ?? 1);
          matched.push(key);
        }
      }
      return { image, score: Math.round(score * 100) / 100, matched };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.image.sort_order - b.image.sort_order ||
        a.image.title.localeCompare(b.image.title)
    );
}

function stableHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * The image for one article: the best keyword match, or, when nothing matches, one picked
 * evenly from the pool by the article id so a list of articles does not repeat one picture.
 */
export function pickFallbackImage(images: ArticleFallbackImage[], subject: FallbackImageSubject): ArticleFallbackImage | null {
  const ranked = scoreFallbackImages(images, subject);
  if (!ranked.length) return null;
  if (ranked[0].score > 0) return ranked[0].image;

  const pool = ranked.map((entry) => entry.image).sort((a, b) => a.sort_order - b.sort_order);
  const seed = subject.id || subject.slug || subject.title || "";
  return pool[stableHash(seed) % pool.length];
}

export function fallbackImageAlt(image: ArticleFallbackImage, locale: Locale | string | null | undefined) {
  return (locale === "en" ? image.title_en || image.title : image.title) || "";
}
