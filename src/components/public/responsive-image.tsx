/**
 * Plain <img> with a srcset when the image was uploaded with size variants.
 *
 * Variant convention (see src/lib/image-variants.ts): files live under
 * `bansko-media/articles/r/<month>/<id>-w480.webp`, `-w960.webp` and `-w1600.webp`.
 * The stored URL points at the largest file; the smaller siblings are derived here,
 * so no extra database lookups are needed. Older single-size images render unchanged.
 */

const variantPattern = /\/articles\/r\/[^/]+\/[^/]+-w1600\.webp$/;
const variantWidths = [480, 960, 1600] as const;

export function hasImageVariants(src: string | null | undefined) {
  return Boolean(src && variantPattern.test(src));
}

export function imageVariantUrl(src: string, width: (typeof variantWidths)[number]) {
  return src.replace(/-w1600\.webp$/, `-w${width}.webp`);
}

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  width,
  height
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const srcSet = hasImageVariants(src)
    ? variantWidths.map((variantWidth) => `${imageVariantUrl(src, variantWidth)} ${variantWidth}w`).join(", ")
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
    <img
      src={srcSet ? imageVariantUrl(src, 960) : src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
