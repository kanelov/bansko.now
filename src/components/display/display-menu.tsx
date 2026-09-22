import { PaperCategoryHead } from "@/components/public/paper-menu";
import type { CategoryBlock } from "@/lib/business-platform/display-layout";
import type { MenuItem } from "@/lib/business-platform/menu";
import { formatPrice } from "@/lib/business-platform/money";

/**
 * Менюто на телевизора: двуезичен ред („Капучино · Cappuccino“), цена или
 * варианти, свършилото зачертано с етикет. Само сървър, само класове от
 * menu-paper.css и display.css - никакъв Tailwind, защото браузърът на
 * телевизора е стар.
 */

function bilingual(names: { bg?: string | null; en?: string | null }) {
  const bg = (names.bg ?? "").trim();
  const en = (names.en ?? "").trim();
  return { bg: bg || en, en: en && en !== bg ? en : "" };
}

function ItemName({ item, showDescriptions }: { item: MenuItem; showDescriptions: boolean }) {
  const name = bilingual(item.names);
  const sold = item.availability === "sold_out";

  return (
    <span className="paper-item__text">
      <span className="paper-item__name">
        {name.bg}
        {name.en ? <span className="paper-item__alt"> · {name.en}</span> : null}
      </span>
      {sold ? <span className="paper-item__sold">свърши</span> : null}
      {showDescriptions && item.description ? <span className="paper-item__desc">{item.description}</span> : null}
    </span>
  );
}

function ItemRow({ item, showDescriptions }: { item: MenuItem; showDescriptions: boolean }) {
  const sold = item.availability === "sold_out";

  return (
    <div className={sold ? "paper-item paper-item--sold" : "paper-item"}>
      <ItemName item={item} showDescriptions={showDescriptions} />
      <span className="paper-item__dots" aria-hidden />
      {item.variants.length > 0 ? (
        <span className="paper-item__price">
          {item.variants.map((variant, index) => (
            <span key={variant.id}>
              {index > 0 ? " · " : ""}
              {variant.name ? <span className="paper-item__variant">{variant.name}</span> : null}
              {formatPrice(variant.priceCents)}
            </span>
          ))}
        </span>
      ) : item.priceCents !== null ? (
        <span className="paper-item__price">{formatPrice(item.priceCents)}</span>
      ) : null}
    </div>
  );
}

function VariantTable({ block, showDescriptions }: { block: CategoryBlock; showDescriptions: boolean }) {
  return (
    <table className="paper-table">
      <thead>
        <tr>
          <th> </th>
          {block.variantColumns?.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.category.items.map((item) => (
          <tr key={item.id} className={item.availability === "sold_out" ? "paper-item--sold" : undefined}>
            <td>
              <ItemName item={item} showDescriptions={showDescriptions} />
            </td>
            {item.variants.map((variant) => (
              <td key={variant.id}>{formatPrice(variant.priceCents)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DisplayColumns({ columns, showDescriptions }: { columns: CategoryBlock[][]; showDescriptions: boolean }) {
  return (
    <div className="display-columns">
      {columns.map((blocks, index) => (
        <div key={index} className="display-column">
          {blocks.map((block) => {
            const name = bilingual(block.category.names);
            return (
              <section key={block.category.id} className="display-category">
                <PaperCategoryHead icon={block.category.icon} name={name.bg} alt={name.en} />
                {block.variantColumns ? (
                  <VariantTable block={block} showDescriptions={showDescriptions} />
                ) : (
                  block.category.items.map((item) => <ItemRow key={item.id} item={item} showDescriptions={showDescriptions} />)
                )}
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}
