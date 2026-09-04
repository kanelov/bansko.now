import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { csvRowToPhotoUpdate, parseCsv } from "@/lib/photo-csv";
import { requireAdmin } from "@/lib/supabase/auth";
import { slugify } from "@/lib/slug";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Reads back the exported CSV and writes the filled in fields. Rows are matched by photo_code,
 * empty cells are ignored, and nothing is created or deleted here.
 */
export async function POST(request: Request) {
  const { supabase } = await requireAdmin();
  const text = await request.text();
  if (!text.trim()) return NextResponse.json({ error: "Файлът е празен." }, { status: 400 });

  const rows = parseCsv(text);
  if (rows.length < 2) return NextResponse.json({ error: "Файлът няма редове с данни." }, { status: 400 });

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (!header.includes("photo_code")) {
    return NextResponse.json({ error: "Липсва колона photo_code." }, { status: 400 });
  }

  let updated = 0;
  const problems: string[] = [];

  for (const row of rows.slice(1, 2001)) {
    const record: Record<string, string> = {};
    header.forEach((name, index) => {
      record[name] = row[index] ?? "";
    });
    const code = (record.photo_code || "").trim().toUpperCase();
    if (!code) continue;

    const update = csvRowToPhotoUpdate(record) as Partial<Photo>;
    const slug = (record.slug || "").trim();
    if (slug) update.slug = slugify(slug);
    if (update.is_published) update.published_at = new Date().toISOString();
    if (!Object.keys(update).length) continue;

    const { error, count } = await supabase
      .from("photos")
      .update(update, { count: "exact" })
      .eq("photo_code", code);
    if (error) {
      problems.push(`${code}: ${error.message}`);
    } else if (!count) {
      problems.push(`${code}: няма такава фотография`);
    } else {
      updated += 1;
    }
  }

  revalidatePath("/admin/photos");
  revalidatePublicPath("/photos");
  return NextResponse.json({ updated, problems: problems.slice(0, 20) }, { headers: { "Cache-Control": "no-store" } });
}
