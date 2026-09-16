import type { MenuCategory, MenuItem } from "@/lib/business-platform/menu";

/**
 * Автоматичното оформление на телевизора - правилата, които заместват редактора.
 * Чисти функции без зависимости, за да се четат и проверяват отделно.
 *
 * - Колоните се смятат от броя редове: до 22 реда една, до 44 две, иначе три
 *   (при шаблон със снимка/видео менюто е на 70 % и колоните са най-много две).
 * - Категорията никога не се къса между колони.
 * - Когато всички артикули в категория имат едни и същи варианти (Малко /
 *   Голямо), вариантите стават колони с цени; иначе цените са в реда.
 */

export type CategoryBlock = {
  category: MenuCategory;
  /** Имената на вариантите като колони, или null за обикновен списък. */
  variantColumns: string[] | null;
  rows: number;
};

function variantSignature(item: MenuItem) {
  return item.variants.map((variant) => variant.name.trim()).join(" | ");
}

export function variantColumnsFor(items: MenuItem[]): string[] | null {
  if (items.length < 2 || items.some((item) => item.variants.length === 0)) {
    return null;
  }

  const first = variantSignature(items[0]);
  const same = items.every((item) => variantSignature(item) === first);
  const names = items[0].variants.map((variant) => variant.name.trim());

  return same && names.every(Boolean) && names.length <= 4 ? names : null;
}

export function buildBlocks(categories: MenuCategory[], showDescriptions: boolean): CategoryBlock[] {
  return categories
    .filter((category) => category.items.length > 0)
    .map((category) => {
      const variantColumns = variantColumnsFor(category.items);
      const itemRows = category.items.reduce((sum, item) => sum + 1 + (showDescriptions && item.description ? 0.7 : 0), 0);

      return { category, variantColumns, rows: 1.6 + itemRows + (variantColumns ? 0.8 : 0) };
    });
}

export function columnCountFor(totalRows: number, maxColumns: number) {
  const wanted = totalRows <= 22 ? 1 : totalRows <= 44 ? 2 : 3;
  return Math.max(1, Math.min(wanted, maxColumns));
}

/** Категориите се нареждат подред в колоните, всяка колона до около равен дял редове. */
export function distributeBlocks(blocks: CategoryBlock[], columns: number): CategoryBlock[][] {
  const result: CategoryBlock[][] = Array.from({ length: columns }, () => []);

  if (columns === 1) {
    result[0] = blocks;
    return result;
  }

  const total = blocks.reduce((sum, block) => sum + block.rows, 0);
  const budget = total / columns;
  let column = 0;
  let used = 0;

  for (const block of blocks) {
    const remainingColumns = columns - column - 1;
    if (used > 0 && used + block.rows / 2 > budget && remainingColumns > 0) {
      column += 1;
      used = 0;
    }
    result[column].push(block);
    used += block.rows;
  }

  return result;
}

export function layoutDisplay(categories: MenuCategory[], options: { showDescriptions: boolean; maxColumns: number }) {
  const blocks = buildBlocks(categories, options.showDescriptions);
  const totalRows = blocks.reduce((sum, block) => sum + block.rows, 0);
  const columns = columnCountFor(totalRows, options.maxColumns);
  return { columns: distributeBlocks(blocks, columns), totalRows };
}
