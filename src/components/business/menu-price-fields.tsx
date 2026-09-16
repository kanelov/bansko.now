"use client";

import { useState } from "react";
import { portalUi } from "@/components/business/ui";

export type VariantRow = {
  key: string;
  id: string | null;
  nameBg: string;
  nameEn: string;
  price: string;
  active: boolean;
};

/**
 * Цената на артикул: една цена или варианти (малко / голямо). Правилото
 * „никога и двете“ се пази в базата; тук само формата го следва.
 */
export function MenuPriceFields({ initialPrice, initialVariants }: { initialPrice: string; initialVariants: VariantRow[] }) {
  const [hasVariants, setHasVariants] = useState(initialVariants.length > 0);
  const [rows, setRows] = useState<VariantRow[]>(initialVariants.length ? initialVariants : [emptyRow(), emptyRow()]);

  const update = (key: string, patch: Partial<VariantRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <fieldset className="grid gap-4 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
      <legend className="px-1 text-sm font-semibold">Цена</legend>

      <input type="hidden" name="has_variants" value={hasVariants ? "1" : "0"} />

      <label className="flex items-center gap-3 text-sm">
        <input
          id="menu-has-variants"
          type="checkbox"
          checked={hasVariants}
          onChange={(event) => setHasVariants(event.target.checked)}
          className="h-5 w-5 accent-forest"
        />
        <span>
          Има варианти <span className={portalUi.hint}>(малко / голямо, единично / двойно, 300 / 500 ml)</span>
        </span>
      </label>

      {!hasVariants ? (
        <label className={portalUi.label}>
          Цена в евро
          <input
            id="menu-price"
            name="price"
            inputMode="decimal"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            placeholder="3,90"
            defaultValue={initialPrice}
            required
            className={portalUi.input + " max-w-40"}
          />
        </label>
      ) : (
        <div className="grid gap-3">
          {rows.map((row, index) => (
            <div key={row.key} className="grid gap-2 rounded-xl border border-[var(--stone)] bg-white p-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
              <input type="hidden" name="variant_id" value={row.id ?? ""} />
              <input type="hidden" name="variant_active" value={row.active ? "1" : "0"} />
              <label className={portalUi.label}>
                <span>
                  Име <span className={portalUi.hint}>BG</span>
                </span>
                <input
                  id={`variant-name-bg-${index}`}
                  name="variant_name_bg"
                  value={row.nameBg}
                  onChange={(event) => update(row.key, { nameBg: event.target.value })}
                  placeholder="Малко"
                  className={portalUi.input}
                />
              </label>
              <label className={portalUi.label}>
                <span>
                  Име <span className={portalUi.hint}>EN</span>
                </span>
                <input
                  id={`variant-name-en-${index}`}
                  name="variant_name_en"
                  value={row.nameEn}
                  onChange={(event) => update(row.key, { nameEn: event.target.value })}
                  placeholder="Small"
                  className={portalUi.input}
                />
              </label>
              <label className={portalUi.label}>
                Цена
                <input
                  id={`variant-price-${index}`}
                  name="variant_price"
                  inputMode="decimal"
                  pattern="[0-9]+([.,][0-9]{1,2})?"
                  value={row.price}
                  onChange={(event) => update(row.key, { price: event.target.value })}
                  placeholder="2,90"
                  className={portalUi.input}
                />
              </label>
              <div className="flex items-center gap-2 pb-1">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    id={`variant-active-${index}`}
                    type="checkbox"
                    checked={row.active}
                    onChange={(event) => update(row.key, { active: event.target.checked })}
                    className="h-4 w-4 accent-forest"
                  />
                  видим
                </label>
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                  className={portalUi.smallButton}
                  aria-label="Премахни варианта"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() => setRows((current) => (current.length >= 8 ? current : [...current, emptyRow()]))}
              className={portalUi.secondaryButton}
            >
              Добави вариант
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

function emptyRow(): VariantRow {
  return { key: Math.random().toString(36).slice(2), id: null, nameBg: "", nameEn: "", price: "", active: true };
}
