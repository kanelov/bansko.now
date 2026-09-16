"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { sofiaDate } from "@/lib/business-platform/hours";
import { revalidateBusinessPublicPages } from "@/lib/business-platform/public-business";

/**
 * Работното време се записва наведнъж: старите редове се трият и се записват
 * новите. По-просто от сравняване ред по ред, а таблицата е най-много 14 реда
 * на бизнес. Ден без интервал = затворено.
 */

const hoursPath = "/business/hours";
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OwnerClient = Awaited<ReturnType<typeof requireBusinessOwner>>["supabase"];

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function withError(code: string) {
  return `${hoursPath}?error=${code}`;
}

async function refreshHours(supabase: OwnerClient, businessId: string) {
  revalidatePath(hoursPath);
  revalidatePath("/business");
  await revalidateBusinessPublicPages(supabase, businessId);
}

export async function saveBusinessHoursAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });

  const rows: { business_id: string; weekday: number; opens: string; closes: string }[] = [];

  for (const weekday of [1, 2, 3, 4, 5, 6, 7]) {
    /* Всеки ден има две смени: сутрин и вечер. Празна двойка = няма смяна. */
    for (const shift of [1, 2]) {
      const opens = stringValue(formData, `opens_${weekday}_${shift}`);
      const closes = stringValue(formData, `closes_${weekday}_${shift}`);

      if (!opens && !closes) {
        continue;
      }

      if (!timePattern.test(opens) || !timePattern.test(closes)) {
        redirect(withError("time"));
      }

      if (opens === closes) {
        redirect(withError("equal"));
      }

      if (rows.some((row) => row.weekday === weekday && row.opens === opens)) {
        redirect(withError("duplicate"));
      }

      rows.push({ business_id: business.businessId, weekday, opens, closes });
    }
  }

  const { error: deleteError } = await supabase.from("business_hours").delete().eq("business_id", business.businessId);

  if (deleteError) {
    redirect(withError("save"));
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("business_hours").insert(rows);

    if (error) {
      redirect(withError("save"));
    }
  }

  await refreshHours(supabase, business.businessId);
  redirect(`${hoursPath}?saved=week`);
}

export async function saveHourExceptionAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });

  const date = stringValue(formData, "date");
  const closed = stringValue(formData, "mode") !== "open";
  const opens = stringValue(formData, "opens");
  const closes = stringValue(formData, "closes");
  const note = stringValue(formData, "note").slice(0, 120);

  if (!datePattern.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) {
    redirect(withError("date"));
  }

  if (date < sofiaDate(new Date())) {
    redirect(withError("past"));
  }

  if (!closed && (!timePattern.test(opens) || !timePattern.test(closes) || opens === closes)) {
    redirect(withError("time"));
  }

  const { error } = await supabase.from("business_hour_exceptions").upsert(
    {
      business_id: business.businessId,
      date,
      is_closed: closed,
      opens: closed ? null : opens,
      closes: closed ? null : closes,
      note: note || null
    },
    { onConflict: "business_id,date" }
  );

  if (error) {
    redirect(withError("save"));
  }

  await refreshHours(supabase, business.businessId);
  redirect(`${hoursPath}?saved=exception`);
}

export async function deleteHourExceptionAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = stringValue(formData, "id");

  if (!uuidPattern.test(id)) {
    redirect(withError("missing"));
  }

  const { error } = await supabase.from("business_hour_exceptions").delete().eq("id", id).eq("business_id", business.businessId);

  if (error) {
    redirect(withError("delete"));
  }

  await refreshHours(supabase, business.businessId);
  redirect(`${hoursPath}?saved=deleted`);
}
