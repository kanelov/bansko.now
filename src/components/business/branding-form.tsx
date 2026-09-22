import type { CSSProperties } from "react";
import Link from "next/link";
import { saveBrandingAction } from "@/app/business/branding/actions";
import { BrandColorField } from "@/components/business/brand-color-field";
import { BrandLogoField } from "@/components/business/brand-logo-field";
import { BrandPresetRadio } from "@/components/business/brand-preset-radio";
import { DisplayPreview } from "@/components/business/display-preview";
import { portalUi } from "@/components/business/ui";
import { IconGlyph } from "@/components/public/icon-glyph";
import type { BusinessMediaUrls } from "@/lib/business-platform/media";
import {
  bodyFonts,
  headingFonts,
  resolveTheme,
  resolvedTokens,
  themeClassName,
  themeOrnaments,
  qrIconGroups,
  themePresetList,
  themePresets,
  themeStyle,
  type BusinessTheme,
  type ThemePreset,
} from "@/lib/business-platform/theme";

/**
 * Формата за бранда: тема, цветове, шрифтове, лого и орнамент. Сървърен
 * компонент - отбелязването на избраната карта е чист CSS (peer-checked).
 * Клиентски са само radio-то на темата (връща шрифтовете и зърното „според
 * темата“, за да се запише каквото картата показва), палитрите (отметка „по
 * темата“) и качването на логото.
 */

const savedMessages: Record<string, string> = {
  "1": "Записано. QR менюто е обновено, телевизорите се презареждат до минута.",
};

const errorMessages: Record<string, string> = {
  save: "Записът не успя. Опитай пак.",
  settings: "Този бизнес още не е включен в платформата - пиши на Bansko NOW.",
  contrast: "Фонът и текстът са твърде близки по цвят и менюто няма да се чете. Избери по-светъл фон или по-тъмен текст.",
  accent: "Акцентът почти не се вижда върху фона. Избери по-тъмен акцент или по-светъл фон.",
};

export function BrandingForm({
  businessId,
  businessName,
  qrPath,
  theme,
  logo,
  sampleCategory,
  preview,
  saved,
  error,
}: {
  businessId: string;
  businessName: string;
  /** Пътят на QR менюто на български, например /places/yum-spot/menu. */
  qrPath: string;
  theme: BusinessTheme;
  logo: BusinessMediaUrls | null;
  /** Име на реална категория за примера в картите; иначе „Топли напитки“. */
  sampleCategory: string;
  /** Първият включен екран - неговият преглед е прегледът на темата. */
  preview: { token: string; refreshKey: string } | null;
  saved?: string;
  error?: string;
}) {
  const tokens = resolvedTokens(theme);
  /* „Според темата“ в списъка, когато записаният шрифт е този на пресета -
     така смяна на картата после записва шрифтовете на новата тема. */
  const presetDefaults = themePresets[theme.preset];
  const headingDefault = theme.heading_font === presetDefaults.heading_font ? "" : theme.heading_font;
  const bodyDefault = theme.body_font === presetDefaults.body_font ? "" : theme.body_font;
  const logoInitial =
    logo && theme.logo_media_id
      ? { id: theme.logo_media_id, url: logo.w480 ?? logo.original }
      : null;

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Бранд</p>
        <h1 className={portalUi.h1}>Лого, цветове и шрифтове</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Темата се прилага на QR менюто, на телевизорите и на менюто за печат.
          Страницата на бизнеса в bansko.now остава във вида на сайта.
        </p>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
        </div>
      ) : null}

      <form action={saveBrandingAction} className="grid gap-6">
        <input type="hidden" name="business_id" value={businessId} />

        {/* 1. Тема */}
        <fieldset className={portalUi.card + " grid gap-4"}>
          <legend className="sr-only">Тема</legend>
          <div>
            <h2 className={portalUi.h2}>Тема</h2>
            <p className="mt-1 text-sm text-stone-650">
              Всяка тема носи свои цветове, шрифтове и хартия. Картите показват
              как ще изглежда менюто на {businessName}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themePresetList.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                businessName={businessName}
                sampleCategory={sampleCategory}
                checked={preset.id === theme.preset}
              />
            ))}
          </div>
        </fieldset>

        {/* 2. Цветове */}
        <fieldset className={portalUi.card + " grid gap-4"}>
          <legend className="sr-only">Цветове</legend>
          <div>
            <h2 className={portalUi.h2}>Цветове</h2>
            <p className="mt-1 text-sm text-stone-650">
              По подразбиране темата решава. Свой цвят слагаш само където трябва
              - например акцентът във фирмения цвят. Фонът и текстът важат за
              светлия вид; тъмният вид на телевизора пази тъмните цветове на
              темата.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <BrandColorField
              name="accent"
              label="Акцент"
              hint="Иконките, линията с точката, орнаментът."
              initial={theme.accent}
              fallback={tokens.accent}
            />
            <BrandColorField
              name="background"
              label="Фон"
              hint="Хартията. Светъл цвят, за да се чете."
              initial={theme.background}
              fallback={tokens.bg}
            />
            <BrandColorField
              name="ink"
              label="Текст"
              hint="Имената и цените. Тъмен цвят."
              initial={theme.ink}
              fallback={tokens.ink}
            />
          </div>
          <p className={portalUi.hint}>
            Смениш ли фона или текста, приглушените надписи и тънките линии се
            изчисляват от тях, за да остане всичко в един тон.
          </p>
        </fieldset>

        {/* 3. Шрифтове */}
        <fieldset className={portalUi.card + " grid gap-4"}>
          <legend className="sr-only">Шрифтове</legend>
          <div>
            <h2 className={portalUi.h2}>Шрифтове</h2>
            <p className="mt-1 text-sm text-stone-650">
              „Според темата“ връща шрифта на избраната тема при запис.
              Телевизорът няма Georgia и показва Playfair Display на нейно
              място; другите шрифтове са вградени и са еднакви навсякъде.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={portalUi.label}>
              Заглавия
              <select
                id="brand-heading-font"
                name="heading_font"
                defaultValue={headingDefault}
                className={portalUi.input}
              >
                <option value="">Според темата</option>
                {headingFonts.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.value === "georgia"
                      ? "Georgia (като Bansko NOW)"
                      : font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={portalUi.label}>
              Текст
              <select
                id="brand-body-font"
                name="body_font"
                defaultValue={bodyDefault}
                className={portalUi.input}
              >
                <option value="">Според темата</option>
                {bodyFonts.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        {/* 4. Лого и орнамент */}
        <fieldset className={portalUi.card + " grid gap-4"}>
          <legend className="sr-only">Лого и орнамент</legend>
          <div>
            <h2 className={portalUi.h2}>Лого и орнамент</h2>
            <p className="mt-1 text-sm text-stone-650">
              Какво стои над името на заведението в менюто: листо, вашето лого
              или нищо.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOrnaments.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ornament"
                  value={option.value}
                  defaultChecked={option.value === theme.ornament}
                  className="accent-forest"
                />
                <span className="font-semibold">{option.label}</span>
              </label>
            ))}
          </div>
          <BrandLogoField initial={logoInitial} />
          <p className={portalUi.hint}>
            Избереш ли „Логото на бизнеса“ без качено лого, менюто показва
            листото.
          </p>
        </fieldset>

        {/* 5. Иконка в QR кода */}
        <fieldset className={portalUi.card + " grid gap-4"}>
          <legend className="sr-only">Иконка в QR кода</legend>
          <div>
            <h2 className={portalUi.h2}>Иконка в QR кода</h2>
            <p className="mt-1 text-sm text-stone-650">
              Малката иконка в средата на QR кода: чаша за кафене, ножица за фризьорски салон, ски за ски училище. Кодът се чете еднакво добре с всяка.
            </p>
          </div>
          <label className={portalUi.label}>
            <span>Иконка</span>
            <select id="brand-qr-icon" name="qr_icon" defaultValue={theme.qr_icon} className={portalUi.input}>
              {qrIconGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.icons.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 text-forest" aria-hidden>
            {qrIconGroups.flatMap((group) => group.icons).map((icon) => (
              <span
                key={icon.value}
                title={icon.label}
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white " +
                  (icon.value === theme.qr_icon ? "border-forest ring-2 ring-forest/30" : "border-[var(--stone)]")
                }
              >
                <IconGlyph name={icon.value} className="h-4 w-4" />
              </span>
            ))}
          </div>
          <p className={portalUi.hint}>Сегашната е с рамка. Промяната се вижда в „QR код“ след „Запази бранда“.</p>
        </fieldset>

        {/* 6. Хартия */}
        <div className={portalUi.card + " grid gap-3"}>
          <label className="flex items-start gap-3 text-sm">
            <input
              id="brand-grain"
              type="checkbox"
              name="grain"
              defaultChecked={theme.grain}
              className="mt-0.5 h-4 w-4 accent-forest"
            />
            <span>
              <span className="block font-semibold">Хартиено зърно</span>
              <span className={portalUi.hint}>
                Лека текстура върху фона, като истинска хартия. Без нея фонът е
                гладък.
              </span>
            </span>
          </label>
        </div>

        {/* 7. Запис */}
        <div className="flex flex-wrap items-center gap-3">
          <button className={portalUi.primaryButton}>Запази бранда</button>
          <span className={portalUi.hint}>
            Промяната стига до QR менюто веднага, до телевизорите - до минута.
          </span>
        </div>
      </form>

      {/* Преглед */}
      <section className={portalUi.card + " grid gap-4"}>
        <div>
          <h2 className={portalUi.h2}>Преглед</h2>
          <p className="mt-1 text-sm text-stone-650">
            {preview
              ? "Първият включен екран, точно както е на телевизора. Показва записаната тема - първо „Запази бранда“."
              : "Няма включен екран, затова няма преглед на телевизора. Отвори QR менюто, за да видиш темата."}
          </p>
        </div>
        {preview ? (
          <DisplayPreview
            src={`/display/${preview.token}?preview=1`}
            refreshKey={preview.refreshKey}
          />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <a
            href={qrPath}
            target="_blank"
            rel="noreferrer"
            className={portalUi.secondaryButton}
          >
            Отвори QR менюто
          </a>
          <Link href="/business/print" className={portalUi.secondaryButton}>
            Меню за печат
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Карта на тема: истинско парче меню с класовете paper-* и цветовете на
 * пресета като inline style, за да се вижда реалният вид, не описание.
 */
function PresetCard({
  preset,
  businessName,
  sampleCategory,
  checked,
}: {
  preset: ThemePreset;
  businessName: string;
  sampleCategory: string;
  checked: boolean;
}) {
  const sample = resolveTheme({ preset: preset.id });
  const style = { ...themeStyle(sample), fontSize: "11px" } as CSSProperties;

  return (
    <label className="relative block cursor-pointer">
      <BrandPresetRadio presetId={preset.id} grain={preset.grain} checked={checked} />
      <span className="block overflow-hidden rounded-2xl border-2 border-[var(--stone)] bg-white transition peer-checked:border-forest peer-focus-visible:ring-2 peer-focus-visible:ring-forest/40 hover:border-moss">
        <span
          className={themeClassName(sample) + " block px-4 py-4"}
          style={style}
          aria-hidden
        >
          <span className="paper-head block">
            <span className="paper-ornament">
              <IconGlyph name="leaf" className="paper-ornament__icon" />
            </span>
            <span
              className="paper-title block"
              style={{ fontSize: "1.25em", margin: "0.3em 0 0.5em" }}
            >
              {businessName}
            </span>
            <span className="paper-rule">
              <span className="paper-rule__dot" />
            </span>
          </span>
          <span className="block" style={{ marginTop: "1.2em" }}>
            {/* Същите класове като PaperCategoryHead, но без заглавен таг - картата е етикет на radio. */}
            <span className="paper-category__head">
              <IconGlyph name="mug-saucer" className="paper-category__icon" />
              <span className="paper-category__name">{sampleCategory}</span>
            </span>
            <span className="block">
              <span className="paper-item">
                <span className="paper-item__text">
                  <span className="paper-item__name">Капучино</span>
                  <span className="paper-item__desc">
                    двойно еспресо, мляко
                  </span>
                </span>
                <span className="paper-item__dots" />
                <span className="paper-item__price">3,20 €</span>
              </span>
              <span className="paper-item">
                <span className="paper-item__text">
                  <span className="paper-item__name">Домашна лимонада</span>
                </span>
                <span className="paper-item__dots" />
                <span className="paper-item__price">4,50 €</span>
              </span>
            </span>
          </span>
        </span>
        <span className="block px-4 py-3">
          <span className="block text-sm font-semibold">{preset.label}</span>
          <span className="mt-0.5 block text-xs text-stone-650">
            {preset.description}
          </span>
        </span>
      </span>
      <span className="absolute right-3 top-3 hidden rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white peer-checked:inline-flex">
        избрана
      </span>
    </label>
  );
}
