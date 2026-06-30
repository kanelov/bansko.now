import type { Json } from "@/lib/types";

function toLinks(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function SourceLinks({ links }: { links: Json }) {
  const sourceLinks = toLinks(links);

  if (!sourceLinks.length) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-stone-200 pt-8">
      <h2 className="font-serif text-2xl font-semibold text-stone-950">Източници</h2>
      <ul className="mt-4 grid gap-2 text-sm text-stone-700">
        {sourceLinks.map((link) => (
          <li key={link}>
            <a href={link} className="break-words text-forest underline underline-offset-4">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
