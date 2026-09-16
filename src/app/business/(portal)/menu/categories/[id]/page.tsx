import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuCategoryForm } from "@/components/business/menu-category-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getMenuCategoryForEdit } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Категория"
};

export default async function EditMenuCategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const { supabase, business } = await requireBusinessOwner();
  const category = await getMenuCategoryForEdit(supabase, business.businessId, id);

  if (!category) {
    notFound();
  }

  return <MenuCategoryForm businessId={business.businessId} category={category} error={error} />;
}
