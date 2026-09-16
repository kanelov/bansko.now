"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { revalidateBusinessPublic } from "@/lib/business-platform/revalidate";

const hoursPath = "/business/hours";
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function timeValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return timePattern.test(value) ? value : null;
}

/** Седемте дни наведнъж: ден с отметка „затворено“ няма ред. */
export async function saveBusinessHoursAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const rows: { business_id: string; weekday: number; opens: string; closes: string }[] = [];

  for (let weekday = 1; weekday <= 7; weekday++) {
    if (formData.get(`closed_${weekday}`) === "on") {
      continue;
    }

    const opens = timeValue(formData, `opens_${weekday}`);
    const closes = timeValue(formData, `closes_${weekday}`);

    if (!opens || !closes || opens === closes) {
      redirect(`${hoursPath}?error=time&day=${weekday}`);
    }

    rows.push({ business_id: business.businessId, weekday, opens, closes });
  }

  const { error: clearError } = await supabase.from("business_hours").delete().eq("business_id", business.businessId);
  if (clearError) {
    redirect(`${hoursPath}?error=save`);
  }

  if (rows.length) {
    const { error } = await supabase.from("business_hours").insert(rows);
    if (error) {
      redirect(`${hoursPath}?error=save`);
    }
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(hoursPath);
  revalidatePath("/business");
  redirect(`${hoursPath}?saved=hours`);
}

export async function addHourExceptionAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const date = stringValue(formData, "date");
  const mode = stringValue(formData, "mode") === "special" ? "special" : "closed";
  const note = stringValue(formData, "note").slice(0, 80) || null;

  if (!datePattern.test(date) || Number.isNaN(Date.parse(date))) {
    redirect(`${hoursPath}?error=date`);
  }

  const opens = mode === "special" ? timeValue(formData, "exception_opens") : null;
  const closes = mode === "special" ? timeValue(formData, "exception_closes") : null;

  if (mode === "special" && (!opens || !closes || opens === closes)) {
    redirect(`${hoursPath}?error=exception-time`);
  }

  const { error } = await supabase
    .from("business_hour_exceptions")
    .upsert(
      { business_id: business.businessId, date, is_closed: mode === "closed", opens, closes, note },
      { onConflict: "business_id,date" }
    );

  if (error) {
    redirect(`${hoursPath}?error=save`);
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(hoursPath);
  revalidatePath("/business");
  redirect(`${hoursPath}?saved=exception`);
}

export async function deleteHourExceptionAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = stringValue(formData, "id");

  if (uuidPattern.test(id)) {
    await supabase.from("business_hour_exceptions").delete().eq("id", id).eq("business_id", business.businessId);
    await revalidateBusinessPublic(supabase, business.businessId);
  }

  revalidatePath(hoursPath);
  revalidatePath("/business");
  redirect(`${hoursPath}?saved=deleted`);
}
