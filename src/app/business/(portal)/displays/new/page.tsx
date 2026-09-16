import type { Metadata } from "next";
import { DisplayForm } from "@/components/business/display-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { listDisplayMedia } from "@/lib/business-platform/displays";
import { getMenuCategoryOptions } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Нов екран"
};

export default async function NewDisplayPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const [categories, media] = await Promise.all([
    getMenuCategoryOptions(supabase, business.businessId),
    listDisplayMedia(supabase, business.businessId)
  ]);

  return <DisplayForm businessId={business.businessId} display={null} categories={categories} media={media} error={error} />;
}
