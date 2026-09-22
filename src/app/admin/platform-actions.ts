"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentBusinessCookie, currentBusinessCookieOptions } from "@/lib/business-platform/auth";
import { slugify } from "@/lib/slug";
import { manageableModules } from "@/lib/business-platform/admin";
import { revalidateBusinessPublic } from "@/lib/business-platform/revalidate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import type { BusinessPlatformStatus } from "@/lib/types";

/**
 * Управлението на Бизнес платформата от админа: статус, план, модули и
 * собственици. Таблиците се пишат със сесията на админа (RLS + пазачите на
 * колони го пускат през is_admin()). Service role се ползва само за едно:
 * създаване на акаунт и смяна на парола в Supabase Auth, което друг път няма.
 */

const platformPath = "/admin/platform";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const statuses: BusinessPlatformStatus[] = ["listing", "active", "suspended"];

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function businessIdValue(formData: FormData) {
  const value = stringValue(formData, "business_id");
  return uuidPattern.test(value) ? value : null;
}

/** Временна парола: 16 знака без двусмислени символи, показва се веднъж на админа. */
function temporaryPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/**
 * Нов бизнес направо от админа - за заведение, което пускаш ти, без да минава
 * през публичната форма. Създава чернова с български превод; снимките,
 * описанието и одобрението остават в „Бизнеси“.
 */
export async function createPlatformBusinessAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = stringValue(formData, "name").slice(0, 120);
  const address = stringValue(formData, "address").slice(0, 200);
  const categoryId = stringValue(formData, "category_id");

  if (!name || !address || !uuidPattern.test(categoryId)) {
    redirect(`${platformPath}?error=${encodeURIComponent("Попълни име, категория и адрес.")}`);
  }

  const { data: categoryName } = await supabase
    .from("business_category_translations")
    .select("name")
    .eq("category_id", categoryId)
    .eq("locale", "bg")
    .maybeSingle();

  if (!categoryName?.name) {
    redirect(`${platformPath}?error=${encodeURIComponent("Категорията не е намерена.")}`);
  }

  const slug = `${slugify(name) || "business"}-${randomUUID().slice(0, 8)}`;
  const { data: business, error } = await supabase
    .from("businesses")
    .insert({ name, slug, category: categoryName.name, category_id: categoryId, address, status: "draft" })
    .select("id")
    .single();

  if (error || !business) {
    redirect(`${platformPath}?error=${encodeURIComponent(error?.message ?? "Бизнесът не се създаде.")}`);
  }

  const { error: translationError } = await supabase.from("business_translations").insert({
    business_id: business.id,
    locale: "bg",
    slug,
    name,
    category: categoryName.name,
    address,
    schema_type: "LocalBusiness"
  });

  if (translationError) {
    redirect(`${platformPath}?error=${encodeURIComponent(translationError.message)}`);
  }

  revalidatePath(platformPath);
  revalidatePath("/admin/businesses");
  redirect(`${platformPath}?saved=created#b-${business.id}`);
}

/**
 * Отваря портала на избрания бизнес с акаунта на админа (поддръжка). Порталът
 * вече пуска админа във всеки бизнес със запис в платформата; тук само се
 * избира кой да е текущият.
 */
export async function openBusinessPortalAction(formData: FormData) {
  await requireAdmin();
  const businessId = businessIdValue(formData);

  if (!businessId) {
    redirect(`${platformPath}?error=invalid`);
  }

  const store = await cookies();
  store.set(currentBusinessCookie, businessId, currentBusinessCookieOptions());
  redirect("/business");
}

export async function savePlatformSettingsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const businessId = businessIdValue(formData);
  const status = stringValue(formData, "platform_status") as BusinessPlatformStatus;
  const plan = stringValue(formData, "plan").slice(0, 40) || "free";

  if (!businessId || !statuses.includes(status)) {
    redirect(`${platformPath}?error=invalid`);
  }

  const { error } = await supabase
    .from("business_platform_settings")
    .upsert({ business_id: businessId, platform_status: status, plan }, { onConflict: "business_id" });

  if (error) {
    redirect(`${platformPath}?error=${encodeURIComponent(error.message)}`);
  }

  /* Спиране или активиране сменя какво вижда публиката - страниците се пресъздават. */
  await revalidateBusinessPublic(supabase, businessId);
  revalidatePath(platformPath);
  redirect(`${platformPath}?saved=status#b-${businessId}`);
}

export async function saveBusinessModulesAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const businessId = businessIdValue(formData);

  if (!businessId) {
    redirect(`${platformPath}?error=invalid`);
  }

  const enabled = new Set(formData.getAll("modules").map((value) => String(value)));
  const rows = manageableModules.map((module) => ({ business_id: businessId, module: module.key, enabled: enabled.has(module.key) }));
  const { error } = await supabase.from("business_modules").upsert(rows, { onConflict: "business_id,module" });

  if (error) {
    redirect(`${platformPath}?error=${encodeURIComponent(error.message)}`);
  }

  await revalidateBusinessPublic(supabase, businessId);
  revalidatePath(platformPath);
  redirect(`${platformPath}?saved=modules#b-${businessId}`);
}

export type OwnerActionState = { ok: boolean; message: string; email?: string; password?: string } | null;

/**
 * Добавя собственик по имейл. Има ли вече акаунт с този имейл - само го
 * закача към бизнеса; няма ли - създава го с временна парола, която се връща
 * направо в състоянието на формата (не минава през адрес, бисквитка или лог).
 */
export async function addBusinessOwnerAction(_previous: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const { supabase, claims } = await requireAdmin();
  const businessId = businessIdValue(formData);
  const email = stringValue(formData, "email").toLowerCase();

  if (!businessId || !emailPattern.test(email)) {
    return { ok: false, message: "Въведи валиден имейл." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, message: "Липсва SUPABASE_SERVICE_ROLE_KEY – акаунти се създават само на живия сайт." };
  }

  /* Потребителите са малко (собственици на заведения), затова една страница стига. */
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    return { ok: false, message: listError.message };
  }

  let userId = list.users.find((user) => (user.email ?? "").toLowerCase() === email)?.id ?? null;
  let password: string | undefined;

  if (!userId) {
    password = temporaryPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) {
      return { ok: false, message: createError?.message ?? "Акаунтът не се създаде." };
    }
    userId = created.user.id;
  }

  const now = new Date().toISOString();
  /* Уникалният индекс (business_id, user_id) е частичен (where user_id is not null),
     а ON CONFLICT не може да го ползва - затова първо проверка, после запис. */
  const { data: existing, error: lookupError } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, message: lookupError.message };
  }

  const { error } = existing
    ? await supabase.from("business_members").update({ role: "owner", invited_email: email, accepted_at: now }).eq("id", existing.id)
    : await supabase.from("business_members").insert({
        business_id: businessId,
        user_id: userId,
        role: "owner",
        invited_email: email,
        invited_by: (claims as { sub?: string }).sub ?? null,
        invited_at: now,
        accepted_at: now
      });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(platformPath);
  return password
    ? { ok: true, message: "Акаунтът е създаден. Паролата се показва само сега – предай я на собственика.", email, password }
    : { ok: true, message: "Този имейл вече има акаунт – закачен е към бизнеса със сегашната си парола.", email };
}

/** Нова временна парола за собственик, който е забравил своята. Показва се веднъж. */
export async function resetOwnerPasswordAction(_previous: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const { supabase } = await requireAdmin();
  const memberId = stringValue(formData, "member_id");

  if (!uuidPattern.test(memberId)) {
    return { ok: false, message: "Невалиден запис." };
  }

  const { data: member } = await supabase.from("business_members").select("user_id, invited_email").eq("id", memberId).maybeSingle();
  if (!member?.user_id) {
    return { ok: false, message: "Този запис няма акаунт." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, message: "Липсва SUPABASE_SERVICE_ROLE_KEY – паролите се сменят само на живия сайт." };
  }

  /* Админ акаунт никога не се пипа оттук, дори да е закачен като собственик. */
  const { data: target } = await admin.auth.admin.getUserById(member.user_id);
  if ((target.user?.app_metadata as { role?: string } | undefined)?.role === "admin") {
    return { ok: false, message: "Това е админ акаунт – паролата му се сменя от Supabase, не оттук." };
  }

  const password = temporaryPassword();
  const { error } = await admin.auth.admin.updateUserById(member.user_id, { password });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Паролата е сменена. Показва се само сега.", email: member.invited_email ?? undefined, password };
}

export async function removeBusinessMemberAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const memberId = stringValue(formData, "member_id");
  const businessId = businessIdValue(formData);

  if (!uuidPattern.test(memberId) || !businessId) {
    redirect(`${platformPath}?error=invalid`);
  }

  const { error } = await supabase.from("business_members").delete().eq("id", memberId).eq("business_id", businessId);
  if (error) {
    redirect(`${platformPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(platformPath);
  redirect(`${platformPath}?saved=member#b-${businessId}`);
}
