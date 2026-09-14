import type { MetadataRoute } from "next";
import { isComingSoonEnabled } from "@/lib/coming-soon";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  /* Докато сайтът е заключен, обхождането остава разрешено нарочно: забраната се
     дава със заглавка noindex на всяка страница, а Google трябва да я прочете, за
     да я изпълни. Забрани ли се обхождането, той не вижда забраната и адресът
     може да остане в индекса. Картата на сайта отпада, защото сочи страници,
     които и без това не се показват. */
  if (isComingSoonEnabled()) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"]
      }
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
