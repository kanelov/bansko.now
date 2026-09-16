import type { Metadata } from "next";
import { MenuCategoryForm } from "@/components/business/menu-category-form";
import { requireBusinessOwner } from "@/lib/business-platform/auth";

export const metadata: Metadata = {
  title: "Нова категория"
};

export default async function NewMenuCategoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { business } = await requireBusinessOwner();

  return <MenuCategoryForm businessId={business.businessId} category={null} error={error} />;
}
