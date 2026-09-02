import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { artGalleryIntegrationSecret } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ArtStudioOrder, ArtStudioProductionStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status events from the request app (app.kanelov.com) for Art Studio orders it received
 * from us. Server-to-server, authenticated with the shared integration secret.
 * Cancelled/deleted/collected orders leave the active list and go to the history tab.
 */

const events = {
  confirmed: { status: null, archive: false, reason: null },
  ready: { status: "ready_for_pickup", archive: false, reason: null },
  collected: { status: "completed", archive: true, reason: "Получена в приложението" },
  cancelled: { status: "cancelled", archive: true, reason: "Отказана в приложението" },
  expired: { status: "cancelled", archive: true, reason: "Изтекла в приложението" },
  deleted: { status: "cancelled", archive: true, reason: "Изтрита в приложението" },
  request_deleted: { status: "cancelled", archive: true, reason: "Заявката е изтрита в приложението" },
  request_printed: { status: "ready_for_pickup", archive: false, reason: null },
  request_restored: { status: "in_production", archive: false, reason: null }
} as const satisfies Record<string, { status: ArtStudioProductionStatus | null; archive: boolean; reason: string | null }>;

type EventName = keyof typeof events;

function authorized(request: Request) {
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!artGalleryIntegrationSecret || !provided) return false;
  const expected = Buffer.from(artGalleryIntegrationSecret);
  const given = Buffer.from(provided);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service role is not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const event = text(body.event, 40) as EventName;
  const reservationId = text(body.reservation_id, 36);
  const reservationCode = text(body.reservation_code, 40);
  if (!(event in events)) return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  if (!(reservationId && uuidPattern.test(reservationId)) && !reservationCode) {
    return NextResponse.json({ error: "Missing reservation reference" }, { status: 400 });
  }

  let query = supabase.from("art_studio_orders").select("id, order_number, production_status, archived_at").limit(1);
  query = reservationId && uuidPattern.test(reservationId) ? query.eq("source_request_id", reservationId) : query.eq("order_number", reservationCode);
  const { data: order, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const rule = events[event];
  const update: Partial<ArtStudioOrder> = {
    source_status: event,
    archived_at: rule.archive ? new Date().toISOString() : null,
    archive_reason: rule.archive ? rule.reason : null,
    ...(rule.status ? { production_status: rule.status } : {})
  };

  const { error: updateError } = await supabase.from("art_studio_orders").update(update).eq("id", order.id);
  if (updateError) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  revalidatePath("/admin/art-studio/orders");
  revalidatePath("/admin", "layout");
  return NextResponse.json(
    { ok: true, order_number: order.order_number, production_status: rule.status ?? order.production_status, archived: rule.archive },
    { headers: { "Cache-Control": "no-store" } }
  );
}
