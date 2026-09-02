"use client";

import { useState } from "react";
import { saveNavigationAction, saveSocialLinksAction } from "@/app/admin/actions";
import { IconGlyph, menuIconOptions, socialIconOptions } from "@/components/public/icon-glyph";
import type { NavigationItem, SocialLink } from "@/lib/types";

const fieldClass = "w-full rounded-lg border border-[var(--admin-line)] bg-white px-3 py-2 text-sm text-stone-950";

function IconSelect({ name, value, options }: { name: string; value?: string | null; options: string[] }) {
  const [selected, setSelected] = useState(value || "");

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel-strong)] text-[var(--admin-ink)]">
        <IconGlyph name={selected} className="h-5 w-5" />
      </span>
      <select name={name} value={selected} onChange={(event) => setSelected(event.target.value)} className={fieldClass}>
        <option value="">Без икона</option>
        {options.map((icon) => (
          <option key={icon} value={icon}>
            {icon}
          </option>
        ))}
      </select>
    </div>
  );
}

function MenuRow({
  item,
  englishItem,
  rowKey,
  onRemove
}: {
  item?: NavigationItem;
  englishItem?: NavigationItem;
  rowKey: string;
  onRemove?: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-4">
      <input type="hidden" name="navigation_row_key" value={rowKey} />
      {item?.id ? <input type="hidden" name={`navigation_id_${rowKey}`} value={item.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr_0.9fr_0.45fr]">
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Име на български
          <input name={`navigation_label_${rowKey}`} defaultValue={item?.label || ""} className={fieldClass} placeholder="Събития" required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Линк
          <input name={`navigation_href_${rowKey}`} defaultValue={item?.href || ""} className={fieldClass} placeholder="/events или https://..." required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Икона
          <IconSelect name={`navigation_icon_name_${rowKey}`} value={item?.icon_name} options={menuIconOptions} />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Ред
          <input name={`navigation_sort_order_${rowKey}`} type="number" defaultValue={item?.sort_order ?? 100} className={fieldClass} />
        </label>
      </div>
      <div className="grid gap-3 rounded-xl border border-[var(--admin-line)] bg-black/10 p-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          English label
          <input name={`navigation_label_en_${rowKey}`} defaultValue={englishItem?.label || ""} className={fieldClass} placeholder="Events" />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Aria label BG / EN
          <div className="grid gap-2 sm:grid-cols-2">
            <input name={`navigation_aria_label_${rowKey}`} defaultValue={item?.aria_label || ""} className={fieldClass} placeholder="Български" />
            <input name={`navigation_aria_label_en_${rowKey}`} defaultValue={englishItem?.aria_label || ""} className={fieldClass} placeholder="English" />
          </div>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--admin-ink)]">
        <label className="choice-row rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel)] px-3 py-2">
          <input className="choice-control" type="checkbox" name={`navigation_is_active_${rowKey}`} defaultChecked={item?.is_active ?? true} />
          <span>Активен</span>
        </label>
        <label className="choice-row rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel)] px-3 py-2">
          <input className="choice-control" type="checkbox" name={`navigation_is_external_${rowKey}`} defaultChecked={item?.is_external ?? false} />
          <span>Външен линк</span>
        </label>
        <label className="choice-row rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel)] px-3 py-2">
          <input className="choice-control" type="checkbox" name={`navigation_open_in_new_tab_${rowKey}`} defaultChecked={item?.open_in_new_tab ?? false} />
          <span>Нов таб</span>
        </label>
        {item ? (
          <label className="choice-row rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-red-900">
            <input className="choice-control" type="checkbox" name={`navigation_delete_${rowKey}`} />
            <span>Изтрий при запис</span>
          </label>
        ) : (
          <button type="button" onClick={onRemove} className="admin-button admin-button-danger px-3 py-2 text-sm font-semibold">
            Премахни полето
          </button>
        )}
      </div>
    </div>
  );
}

function SocialRow({ item, rowKey, onRemove }: { item?: SocialLink; rowKey: string; onRemove?: () => void }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-4">
      <input type="hidden" name="social_row_key" value={rowKey} />
      {item?.id ? <input type="hidden" name={`social_id_${rowKey}`} value={item.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[0.75fr_0.9fr_1.4fr_0.85fr_0.4fr]">
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Платформа
          <input name={`social_platform_${rowKey}`} defaultValue={item?.platform || ""} className={fieldClass} placeholder="instagram" required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Достъпно име
          <input name={`social_label_${rowKey}`} defaultValue={item?.label || ""} className={fieldClass} placeholder="Instagram" required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          URL
          <input type="url" name={`social_url_${rowKey}`} defaultValue={item?.url || ""} className={fieldClass} placeholder="https://..." required />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Икона
          <IconSelect name={`social_icon_name_${rowKey}`} value={item?.icon_name || item?.platform} options={socialIconOptions} />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold uppercase text-[var(--admin-muted)]">
          Ред
          <input name={`social_sort_order_${rowKey}`} type="number" defaultValue={item?.sort_order ?? 100} className={fieldClass} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--admin-ink)]">
        <label className="choice-row rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel)] px-3 py-2">
          <input className="choice-control" type="checkbox" name={`social_is_active_${rowKey}`} defaultChecked={item?.is_active ?? true} />
          <span>Показвай иконата</span>
        </label>
        {item ? (
          <label className="choice-row rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-red-900">
            <input className="choice-control" type="checkbox" name={`social_delete_${rowKey}`} />
            <span>Изтрий при запис</span>
          </label>
        ) : (
          <button type="button" onClick={onRemove} className="admin-button admin-button-danger px-3 py-2 text-sm font-semibold">
            Премахни полето
          </button>
        )}
      </div>
    </div>
  );
}

export function NavigationItemsEditor({ items, englishItems }: { items: NavigationItem[]; englishItems: NavigationItem[] }) {
  const [newRows, setNewRows] = useState<string[]>([]);
  const englishById = new Map(englishItems.map((item) => [item.id, item]));

  return (
    <form action={saveNavigationAction} className="grid gap-5">
      <div className="grid gap-4">
        {items.map((item) => (
          <MenuRow key={item.id} item={item} englishItem={englishById.get(item.id)} rowKey={`existing-${item.id}`} />
        ))}
        {newRows.map((rowKey) => (
          <MenuRow key={rowKey} rowKey={rowKey} onRemove={() => setNewRows((rows) => rows.filter((row) => row !== rowKey))} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setNewRows((rows) => [...rows, `new-${Date.now()}-${rows.length}`])}
          className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold"
        >
          + Добави елемент
        </button>
        <button className="admin-button admin-button-primary px-5 py-2 text-sm font-semibold">Запази менюто</button>
      </div>
    </form>
  );
}

export function SocialLinksEditor({ items }: { items: SocialLink[] }) {
  const [newRows, setNewRows] = useState<string[]>([]);

  return (
    <form action={saveSocialLinksAction} className="grid gap-5">
      <div className="grid gap-4">
        {items.map((item) => (
          <SocialRow key={item.id} item={item} rowKey={`existing-${item.id}`} />
        ))}
        {newRows.map((rowKey) => (
          <SocialRow key={rowKey} rowKey={rowKey} onRemove={() => setNewRows((rows) => rows.filter((row) => row !== rowKey))} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setNewRows((rows) => [...rows, `new-${Date.now()}-${rows.length}`])}
          className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold"
        >
          + Добави социална мрежа
        </button>
        <button className="admin-button admin-button-primary px-5 py-2 text-sm font-semibold">Запази социалните икони</button>
      </div>
    </form>
  );
}
