"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBusinessDirectorySettings } from "@/lib/businesses";
import { sendNotificationEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const businessImagesBucket = "business-images";
const maxBusinessImageSize = 2 * 1024 * 1024;
const allowedBusinessImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function arrayValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function numberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  const parsed = value ? Number.parseFloat(value.replace(",", ".")) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

function jsonFaqs(formData: FormData) {
  const questions = formData.getAll("faq_question");
  const answers = formData.getAll("faq_answer");

  return questions
    .map((question, index) => {
      const answer = answers[index];

      return {
        question: typeof question === "string" ? question.trim() : "",
        answer: typeof answer === "string" ? answer.trim() : ""
      };
    })
    .filter((item) => item.question && item.answer);
}

async function uploadBusinessImages(formData: FormData, slug: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const files = formData
    .getAll("business_images")
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, 8);
  const urls: string[] = [];

  for (const file of files) {
    if (!allowedBusinessImageTypes.has(file.type) || file.size > maxBusinessImageSize) {
      continue;
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `${slug}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(businessImagesBucket).upload(storagePath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false
    });

    if (!error) {
      const {
        data: { publicUrl }
      } = supabase.storage.from(businessImagesBucket).getPublicUrl(storagePath);
      urls.push(publicUrl);
    }
  }

  return urls;
}

export async function submitBusinessAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/businesses/submit?error=missing-env");
  }

  const name = stringValue(formData, "name");
  const category = stringValue(formData, "category");
  const address = stringValue(formData, "address");
  const ownerName = stringValue(formData, "owner_name");
  const ownerEmail = stringValue(formData, "owner_email");

  if (!name || !category || !address || !ownerName || !ownerEmail) {
    redirect("/businesses/submit?error=missing-fields");
  }

  const slugBase = slugify(name);
  const slug = `${slugBase || "business"}-${randomUUID().slice(0, 8)}`;
  const images = await uploadBusinessImages(formData, slug);
  const requestedPlanId = stringValue(formData, "requested_plan_id");
  const payload = {
    name,
    slug,
    category,
    description: stringValue(formData, "description"),
    address,
    latitude: numberValue(formData, "latitude"),
    longitude: numberValue(formData, "longitude"),
    video_link: stringValue(formData, "video_link"),
    website_url: stringValue(formData, "website_url"),
    instagram_url: stringValue(formData, "instagram_url"),
    facebook_url: stringValue(formData, "facebook_url"),
    images,
    faqs: jsonFaqs(formData),
    features: arrayValues(formData, "features"),
    requested_services: arrayValues(formData, "requested_services"),
    requested_plan_id: requestedPlanId,
    status: "draft" as const,
    payment_status: requestedPlanId ? ("pending" as const) : ("unpaid" as const)
  };

  const result = await supabase.from("businesses").insert(payload).select("id, name").single();

  if (result.error || !result.data?.id) {
    redirect(`/businesses/submit?error=${encodeURIComponent(result.error?.message || "submission-failed")}`);
  }

  await supabase.from("business_contacts").insert({
    business_id: result.data.id,
    owner_name: ownerName,
    owner_phone: stringValue(formData, "owner_phone"),
    owner_email: ownerEmail
  });

  const settings = await getBusinessDirectorySettings();
  await sendNotificationEmail({
    to: settings.notification_email,
    subject: requestedPlanId ? "Bansko NOW: нова заявка за платен бизнес листинг" : "Bansko NOW: нов бизнес листинг",
    title: requestedPlanId ? "Нова заявка за платен бизнес листинг" : "Нов бизнес листинг",
    intro: "Има нова заявка в Bansko NOW Business Directory.",
    rows: [
      { label: "Бизнес", value: name },
      { label: "Категория", value: category },
      { label: "Адрес", value: address },
      { label: "Собственик", value: ownerName },
      { label: "Имейл", value: ownerEmail },
      { label: "Телефон", value: stringValue(formData, "owner_phone") },
      { label: "Платен план", value: requestedPlanId ? "Избран е платен/видим план" : "Не е избран" }
    ],
    actionUrl: `${siteUrl}/admin/businesses`,
    actionLabel: "Към бизнес заявките"
  });

  revalidatePath("/admin/businesses");
  redirect("/businesses/submit?submitted=1");
}

export async function submitContactMessageAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/contact?error=missing-env");
  }

  const name = stringValue(formData, "name");
  const email = stringValue(formData, "email");
  const message = stringValue(formData, "message");

  if (!name || !email || !message) {
    redirect("/contact?error=missing-fields");
  }

  const payload = {
    name,
    email,
    phone: stringValue(formData, "phone"),
    subject: stringValue(formData, "subject"),
    message
  };

  const { error } = await supabase.from("contact_messages").insert(payload);

  if (error) {
    redirect(`/contact?error=${encodeURIComponent(error.message)}`);
  }

  const settings = await getBusinessDirectorySettings();
  await sendNotificationEmail({
    to: settings.notification_email,
    subject: "Bansko NOW: ново съобщение от контакт форма",
    title: "Ново съобщение от контакт форма",
    rows: [
      { label: "Име", value: name },
      { label: "Имейл", value: email },
      { label: "Телефон", value: payload.phone },
      { label: "Тема", value: payload.subject },
      { label: "Съобщение", value: message }
    ],
    actionUrl: `${siteUrl}/admin/businesses#messages`,
    actionLabel: "Към admin"
  });

  redirect("/contact?sent=1");
}
