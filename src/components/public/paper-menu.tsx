import { IconGlyph } from "@/components/public/icon-glyph";

/**
 * Общите парчета на „хартиеното меню“ (menu-paper.css): заглавието с орнамент
 * и заглавието на категория с иконка. Само сървър, само класове paper-* - без
 * Tailwind, защото ги рисува и телевизорът.
 */

export type PaperMenuLogo = { src: string; alt: string };

/**
 * Орнаментът над името: листо (по подразбиране), логото на бизнеса от темата
 * или нищо. Без лого „logo“ пада на листото, за да не остане празно място.
 */
export function PaperMenuHead({
  title,
  subtitle,
  className = "",
  logo = null,
  ornament = "leaf"
}: {
  title: string;
  subtitle?: string | null;
  className?: string;
  logo?: PaperMenuLogo | null;
  ornament?: "leaf" | "logo" | "none";
}) {
  const showLogo = ornament === "logo" && logo?.src;

  return (
    <header className={`paper-head ${className}`.trim()}>
      {showLogo ? (
        <span className="paper-ornament">
          {/* eslint-disable-next-line @next/next/no-img-element -- логото идва от R2, без оптимизатора на Vercel */}
          <img className="paper-ornament__logo" src={logo.src} alt={logo.alt} />
        </span>
      ) : ornament === "none" ? null : (
        <span className="paper-ornament" aria-hidden>
          <IconGlyph name="leaf" className="paper-ornament__icon" />
        </span>
      )}
      <h1 className="paper-title">{title}</h1>
      <div className="paper-rule" aria-hidden>
        <span className="paper-rule__dot" />
      </div>
      {subtitle ? <p className="paper-subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function PaperCategoryHead({ icon, name, alt, as: Tag = "h2" }: { icon: string; name: string; alt?: string | null; as?: "h2" | "h3" }) {
  return (
    <Tag className="paper-category__head">
      <IconGlyph name={icon} className="paper-category__icon" />
      <span className="paper-category__name">
        {name}
        {alt ? <span className="paper-category__alt"> · {alt}</span> : null}
      </span>
    </Tag>
  );
}
