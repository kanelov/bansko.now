import { getBusinessVideoEmbedUrl } from "@/lib/business-public";
import type { BusinessWithRelations } from "@/lib/types";

type BusinessMediaProps = {
  business: Pick<BusinessWithRelations, "name" | "images" | "video_link" | "image_alt" | "placeholder_image_url">;
  className?: string;
  imageClassName?: string;
  preferVideo?: boolean;
  loading?: "lazy" | "eager";
};

export function BusinessMedia({
  business,
  className = "aspect-[4/3] overflow-hidden bg-sage",
  imageClassName = "h-full w-full object-cover",
  preferVideo = false,
  loading = "lazy"
}: BusinessMediaProps) {
  const image = business.images?.[0] || null;
  const embedUrl = getBusinessVideoEmbedUrl(business.video_link);

  if (embedUrl && (preferVideo || !image)) {
    return (
      <div className={className}>
        <iframe
          src={embedUrl}
          title={`${business.name} видео`}
          className="h-full w-full"
          loading={loading}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (image) {
    return (
      <div className={className}>
        <img src={image} alt={business.image_alt || business.name} className={imageClassName} loading={loading} />
      </div>
    );
  }

  /* Шаблонната илюстрация на категорията (попълнена при четене), докато бизнесът няма своя снимка. */
  if (business.placeholder_image_url) {
    return (
      <div className={className}>
        <img src={business.placeholder_image_url} alt={business.image_alt || business.name} className={imageClassName} loading={loading} />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center text-sm font-semibold text-forest`}>
      Bansko NOW Local
    </div>
  );
}
