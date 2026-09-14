"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPreviewCode, previewCookieMaxAge, previewCookieName, previewToken } from "@/lib/coming-soon";

export async function unlockPreviewAction(formData: FormData) {
  const entered = String(formData.get("code") || "").trim();

  if (!entered || entered !== getPreviewCode()) {
    /* Кодът се проверява на сървъра, затова в страницата няма какво да се
       прочете от изходния код на браузъра. */
    redirect("/coming-soon?error=1");
  }

  const store = await cookies();
  store.set(previewCookieName, await previewToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: previewCookieMaxAge
  });

  redirect("/");
}

export async function lockPreviewAction() {
  const store = await cookies();
  store.delete(previewCookieName);
  redirect("/coming-soon");
}
