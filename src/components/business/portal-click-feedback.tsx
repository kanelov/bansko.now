"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Обратна връзка при натискане: бутонът, който е изпратил форма, става
 * „зает“ (въртящо се кръгче, не се натиска втори път), докато страницата не
 * се смени. Самото натискане се вижда през :active в globals.css
 * ([data-click-feedback]). Слага се веднъж в портала и в админа.
 */
export function PortalClickFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.dataset.clickFeedback = "1";

    const onSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented) return;
      const submitter = event.submitter as HTMLElement | null;
      if (!submitter) return;
      submitter.setAttribute("data-pending", "1");
      submitter.setAttribute("aria-busy", "true");
    };

    document.addEventListener("submit", onSubmit);
    return () => document.removeEventListener("submit", onSubmit);
  }, []);

  /* Нова страница или нов адрес (?saved=…, ?error=…) = формата е обработена. */
  useEffect(() => {
    document.querySelectorAll("[data-pending]").forEach((element) => {
      element.removeAttribute("data-pending");
      element.removeAttribute("aria-busy");
    });
  }, [pathname, searchParams]);

  return null;
}
