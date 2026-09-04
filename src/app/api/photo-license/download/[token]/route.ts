import { NextResponse } from "next/server";
import { createPrivateDownloadUrl } from "@/lib/photo-storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Delivers the purchased file. The token identifies a paid order; the variant comes from the
 * license that was bought, so a web license can never reach the full resolution file.
 * The signed R2 link is generated on demand and expires.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32,64}$/i.test(token)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: order } = await supabase
    .from("photo_license_orders")
    .select("id,status,photo_id,license_type_id,download_count")
    .eq("download_token", token)
    .maybeSingle();
  if (!order || order.status !== "paid") return NextResponse.json({ error: "Not available" }, { status: 404 });

  const [{ data: license }, { data: photo }] = await Promise.all([
    supabase.from("photo_license_types").select("download_variant").eq("id", order.license_type_id).maybeSingle(),
    supabase.from("photos").select("photo_code,web_license_key,full_resolution_key").eq("id", order.photo_id).maybeSingle()
  ]);
  if (!license || !photo) return NextResponse.json({ error: "Not available" }, { status: 404 });

  const key = license.download_variant === "full_resolution" ? photo.full_resolution_key : photo.web_license_key;
  if (!key) return NextResponse.json({ error: "File is not ready" }, { status: 409 });

  const url = await createPrivateDownloadUrl(key, 1800, `${photo.photo_code}.jpg`);
  await supabase
    .from("photo_license_orders")
    .update({ download_count: (order.download_count ?? 0) + 1, last_download_at: new Date().toISOString() })
    .eq("id", order.id);

  return NextResponse.redirect(url, { status: 307, headers: { "Cache-Control": "no-store" } });
}
