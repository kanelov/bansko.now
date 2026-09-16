import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DisplayForm } from "@/components/business/display-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getDisplayForEdit, listDisplayMedia } from "@/lib/business-platform/displays";
import { getMenuCategoryOptions } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Екран"
};

export default async function EditDisplayPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ id }, { error, saved }] = await Promise.all([params, searchParams]);
  const { supabase, business } = await requireBusinessOwner();
  const [display, categories, media] = await Promise.all([
    getDisplayForEdit(supabase, business.businessId, id),
    getMenuCategoryOptions(supabase, business.businessId),
    listDisplayMedia(supabase, business.businessId)
  ]);

  if (!display) {
    notFound();
  }

  return <DisplayForm businessId={business.businessId} display={display} categories={categories} media={media} error={error} saved={saved} />;
}
