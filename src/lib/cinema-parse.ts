import type { CinemaScreening } from "@/lib/cinema";

/**
 * Парсер на програмата от kinoarena.com. Попълва се след като страницата стане достъпна от средата
 * (нейната структура още не е прочетена). До тогава не разпознава нищо и cron маршрутът записва грешка,
 * без да пипа старите данни.
 */
export function parseKinoArenaProgram(html: string, sourceUrl: string): CinemaScreening[] {
  void html;
  void sourceUrl;
  return [];
}
