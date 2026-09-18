"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";

/**
 * Смяна на паролата на админ акаунта. Акаунтът е един за админа и за бизнес
 * портала (ако админът е закачен като собственик някъде), затова паролата важи
 * и на двете места. Текстът ѝ не се чете никъде освен тук.
 */
export async function changeAdminPasswordAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const password = formData.get("password");
  const repeat = formData.get("password_repeat");

  if (typeof password !== "string" || password.length < 10) {
    redirect("/admin/account?error=short");
  }

  if (password !== repeat) {
    redirect("/admin/account?error=mismatch");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/admin/account?error=save");
  }

  redirect("/admin/account?saved=1");
}
