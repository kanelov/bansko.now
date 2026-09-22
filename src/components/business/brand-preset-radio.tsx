"use client";

import type { ChangeEvent } from "react";
import type { ThemePresetId } from "@/lib/business-platform/theme";

/**
 * Radio-то на картата с тема. При избор връща шрифтовете на „Според темата“ и
 * слага зърното на пресета, така че записът е точно каквото картата показва.
 * Избере ли собственикът шрифт или зърно след това, неговият избор остава.
 */
export function BrandPresetRadio({ presetId, grain, checked }: { presetId: ThemePresetId; grain: boolean; checked: boolean }) {
  function applyPresetDefaults(event: ChangeEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const heading = form.querySelector<HTMLSelectElement>("#brand-heading-font");
    const body = form.querySelector<HTMLSelectElement>("#brand-body-font");
    const grainBox = form.querySelector<HTMLInputElement>("#brand-grain");
    if (heading) heading.value = "";
    if (body) body.value = "";
    if (grainBox) grainBox.checked = grain;
  }

  return <input type="radio" name="preset" value={presetId} defaultChecked={checked} onChange={applyPresetDefaults} className="peer sr-only" />;
}
