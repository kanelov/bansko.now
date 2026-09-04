export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bansko.now";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export const openMeteoBaseUrl =
  process.env.OPEN_METEO_API_BASE_URL || "https://api.open-meteo.com/v1/forecast";

export const resendApiKey = process.env.RESEND_API_KEY || null;
export const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || null;
export const emailFrom = process.env.EMAIL_FROM || "Bansko NOW <onboarding@resend.dev>";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY || null;
/**
 * Stripe signs test and live events with different secrets. Each variable may hold one secret,
 * and the *_TEST variants add the sandbox one, so no comma separated lists are needed.
 */
function webhookSecretList(...values: Array<string | undefined>) {
  const secrets = values.flatMap((value) => String(value || "").split(/[,\s]+/)).filter((secret) => secret.startsWith("whsec_"));
  return secrets.length ? [...new Set(secrets)].join(",") : null;
}

export const stripeWebhookSecret = webhookSecretList(process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_TEST);
/** The photo license endpoint has its own signing secret; falls back to the Art Studio one. */
export const stripePhotoWebhookSecret = webhookSecretList(
  process.env.STRIPE_PHOTO_WEBHOOK_SECRET,
  process.env.STRIPE_PHOTO_WEBHOOK_SECRET_TEST,
  process.env.STRIPE_WEBHOOK_SECRET
);
export const artGalleryCatalogApiUrl = process.env.ART_GALLERY_CATALOG_API_URL
  || "https://app.kanelov.com/api/public-catalog";
export const artGalleryReservationApiUrl = process.env.ART_GALLERY_RESERVATION_API_URL
  || "https://app.kanelov.com/api/reservations";
export const artGalleryArtStudioOrdersApiUrl = process.env.ART_GALLERY_ART_STUDIO_API_URL
  || artGalleryReservationApiUrl.replace(/\/api\/reservations\/?$/, "/api/art-studio-orders");
export const artGalleryIntegrationSecret = process.env.ART_GALLERY_INTEGRATION_SECRET || null;
export const contentHubPublishSecret = process.env.CONTENT_HUB_PUBLISH_SECRET || null;

/** Cloudflare R2 holds the photo library derivatives; masters stay in Google Drive. */
export const r2AccountId = process.env.R2_ACCOUNT_ID || null;
export const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || null;
export const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || null;
export const r2BucketName = process.env.R2_BUCKET_NAME || null;
/** Public base URL of the bucket (r2.dev subdomain today, photos.bansko.now later). */
export const photoPublicBaseUrl = (process.env.PHOTO_PUBLIC_BASE_URL || "").replace(/\/$/, "") || null;
