"use server";

import { requireAdmin } from "@/lib/supabase/auth";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessVideo
} from "@/lib/business-platform/media";

/**
 * Видеата за екраните ги качва админът (решение на собственика): така файлът
 * е винаги MP4 в размер, който върви на телевизор. Пътят е същият като при
 * снимките - подписан PUT от браузъра към R2, после ред в business_media с
 * kind = 'display', откъдето порталът го предлага за избор.
 */

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UploadTicket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createBusinessVideoUploadAction(input: { businessId: string; contentType: string; bytes: number }): Promise<UploadTicket> {
  await requireAdmin();

  if (!uuidPattern.test(String(input.businessId || ""))) {
    return { ok: false, error: "Невалиден бизнес." };
  }

  if (!businessMediaConfigured()) {
    return { ok: false, error: "Хранилището (R2) не е настроено." };
  }

  try {
    const ticket = await createBusinessUploadTicket({
      businessId: input.businessId,
      contentType: String(input.contentType || ""),
      bytes: Number(input.bytes),
      mediaType: "video"
    });
    return { ok: true, ...ticket };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неуспешна заявка за качване." };
  }
}

type FinalizeResult = { ok: true; id: string; url: string | null } | { ok: false; error: string };

export async function finalizeBusinessVideoAction(input: { businessId: string; key: string; alt?: string }): Promise<FinalizeResult> {
  const { supabase } = await requireAdmin();

  if (!uuidPattern.test(String(input.businessId || ""))) {
    return { ok: false, error: "Невалиден бизнес." };
  }

  try {
    const media = await finalizeBusinessVideo({
      supabase,
      businessId: input.businessId,
      key: String(input.key || ""),
      kind: "display",
      alt: input.alt ?? null
    });
    return { ok: true, id: media.id, url: businessMediaUrls(media).original };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Записът на видеото не успя." };
  }
}

export async function deleteBusinessVideoAction(input: { businessId: string; id: string }): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();

  if (!uuidPattern.test(String(input.businessId || "")) || !uuidPattern.test(String(input.id || ""))) {
    return { ok: false, error: "Невалидно видео." };
  }

  try {
    await deleteBusinessMedia(supabase, input.businessId, input.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Изтриването не успя." };
  }
}
