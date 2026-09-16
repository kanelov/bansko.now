import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuItemForm } from "@/components/business/menu-item-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getMenuCategoryOptions, getMenuItemForEdit } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Артикул"
};

export default async function EditMenuItemPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const { supabase, business } = await requireBusinessOwner();
  const [item, categories] = await Promise.all([
    getMenuItemForEdit(supabase, business.businessId, id),
    getMenuCategoryOptions(supabase, business.businessId)
  ]);

  if (!item) {
    notFound();
  }

  return <MenuItemForm businessId={business.businessId} categories={categories} item={item} error={error} />;
}
