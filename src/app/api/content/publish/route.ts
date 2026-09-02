import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ContentHubError,
  listContentHubCategories,
  parseContentHubPayload,
  publishContentHubArticle
} from "@/lib/content-hub";
import { contentHubPublishSecret } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Content Hub -> Bansko NOW bridge.
 * GET  returns the available categories (used for the category dropdown and connection test).
 * POST creates or updates one article. Idempotent by content_hub_item_id.
 * Authentication: Bearer CONTENT_HUB_PUBLISH_SECRET, server-to-server only.
 */

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAuthorized(request: Request) {
  if (!contentHubPublishSecret) return false;
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const expected = Buffer.from(contentHubPublishSecret);
  const candidate = Buffer.from(provided);

  return expected.length > 0 && expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function prepare(request: Request) {
  if (!contentHubPublishSecret) {
    return { error: json({ error: "Content Hub publishing is not configured on this site." }, 503) };
  }

  if (!isAuthorized(request)) {
    return { error: json({ error: "Unauthorized" }, 401) };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { error: json({ error: "Supabase service role is not configured." }, 503) };
  }

  return { supabase };
}

export async function GET(request: Request) {
  const context = prepare(request);
  if (context.error) return context.error;

  try {
    const categories = await listContentHubCategories(context.supabase);
    return json({ ok: true, site: "bansko.now", categories });
  } catch (error) {
    if (error instanceof ContentHubError) return json({ error: error.message }, error.status);
    console.error("Content Hub categories failed", error instanceof Error ? error.message : error);
    return json({ error: "Категориите не могат да бъдат прочетени." }, 500);
  }
}

export async function POST(request: Request) {
  const context = prepare(request);
  if (context.error) return context.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    const payload = parseContentHubPayload(body);
    const result = await publishContentHubArticle(context.supabase, payload);
    return json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ContentHubError) {
      return json({ error: error.message, details: error.details }, error.status);
    }

    console.error("Content Hub publish failed", error instanceof Error ? error.message : error);
    return json({ error: "Публикуването в Bansko NOW е неуспешно." }, 500);
  }
}
