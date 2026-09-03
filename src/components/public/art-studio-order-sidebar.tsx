"use client";

import { useState } from "react";
import { ArtStudioEnquiryForm } from "@/components/public/art-studio-enquiry-form";
import { ArtStudioGalleryDesignPicker } from "@/components/public/art-studio-gallery-design-picker";
import type { ArtStudioGalleryPicker } from "@/lib/art-studio-gallery";
import type { SelectedGalleryDesign } from "@/lib/art-studio-gallery-types";
import type { ArtStudioPublicSettings, Locale, LocalizedArtStudioProductType, SourceVariantGroup } from "@/lib/types";

/**
 * Sidebar of a product type page: the compact gallery design picker (when the type is mapped to a
 * gallery category) above the unchanged Art Studio order form. The selected design is optional and
 * only its catalog id travels with the order; the server re-validates it.
 */
export function ArtStudioOrderSidebar({
  productType,
  settings,
  locale,
  sourceGroups,
  formCopy,
  picker
}: {
  productType: LocalizedArtStudioProductType;
  settings: ArtStudioPublicSettings;
  locale: Locale;
  sourceGroups: SourceVariantGroup[];
  formCopy: { eyebrow?: string; intro?: string; button?: string };
  picker: ArtStudioGalleryPicker | null;
}) {
  const [selected, setSelected] = useState<SelectedGalleryDesign | null>(null);

  return (
    <div className="grid gap-5">
      {picker ? (
        <ArtStudioGalleryDesignPicker
          locale={locale}
          config={picker.config}
          firstPage={picker.firstPage}
          selected={selected}
          onSelect={setSelected}
          onClear={() => setSelected(null)}
        />
      ) : null}
      <ArtStudioEnquiryForm
        productType={productType}
        settings={settings}
        locale={locale}
        sourceGroups={sourceGroups}
        formCopy={formCopy}
        galleryDesign={selected}
        onClearGalleryDesign={() => setSelected(null)}
      />
    </div>
  );
}
