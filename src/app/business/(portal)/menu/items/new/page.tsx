import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MenuItemForm } from "@/components/business/menu-item-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getMenuCategoryOptions } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Нов артикул"
};

export default async function NewMenuItemPage({ searchParams }: { searchParams: Promise<{ error?: string; category?: string }> }) {
  const { error, category } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const categories = await getMenuCategoryOptions(supabase, business.businessId);

  /* Без категория няма къде да отиде артикулът. */
  if (categories.length === 0) {
    redirect("/business/menu/categories/new");
  }

  return <MenuItemForm businessId={business.businessId} categories={categories} item={null} defaultCategoryId={category ?? null} error={error} />;
}
