"use server";

import { requireBusinessOwner } from "@/lib/business-platform/auth";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessImage
} from "@/lib/business-platform/media";

/**
 * Фонът на менюто за печат: снимка с kind = 'print_background'. Качва се по
 * същия път като всяка снимка на бизнеса - подписан PUT от браузъра към R2,
 * после сървърът прави размерите. За печат се ползва оригиналът.
 */

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UploadTicket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createPrintBackgroundUploadAction(input: { contentType: string; bytes: number }): Promise<UploadTicket> {
  const { business } = await requireBusinessOwner();

  if (!businessMediaConfigured()) {
    return { ok: false, error: "Хранилището за снимки не е настроено." };
  }

  try {
    const ticket = await createBusinessUploadTicket({
      businessId: business.businessId,
      contentType: String(input.contentType || ""),
      bytes: Number(input.bytes),
      mediaType: "image"
    });
    return { ok: true, ...ticket };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неуспешна заявка за качване." };
  }
}

type FinalizeResult = { ok: true; id: string; url: string | null } | { ok: false; error: string };

export async function finalizePrintBackgroundAction(input: { key: string }): Promise<FinalizeResult> {
  const { supabase, business } = await requireBusinessOwner();

  try {
    const media = await finalizeBusinessImage({ supabase, businessId: business.businessId, key: String(input.key || ""), kind: "print_background", alt: null });
    return { ok: true, id: media.id, url: businessMediaUrls(media).w480 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на снимката не успя." };
  }
}

export async function deletePrintBackgroundAction(input: { id: string }): Promise<{ ok: boolean; error?: string }> {
  const { supabase, business } = await requireBusinessOwner();

  if (!uuidPattern.test(String(input.id || ""))) {
    return { ok: false, error: "Невалидна снимка." };
  }

  try {
    await deleteBusinessMedia(supabase, business.businessId, input.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Изтриването не успя." };
  }
}
