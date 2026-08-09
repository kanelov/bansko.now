import type { BusinessPaymentStatus, BusinessStatus, BusinessTier } from "@/lib/types";

export const businessTierLabels: Record<BusinessTier, string> = {
  free: "Безплатен",
  featured: "Препоръчан",
  premium: "Премиум",
  homepage: "Фокус на началната"
};

export const businessStatusLabels: Record<BusinessStatus, string> = {
  draft: "Чернова",
  approved: "Одобрен",
  rejected: "Отхвърлен"
};

export const businessPaymentStatusLabels: Record<BusinessPaymentStatus, string> = {
  unpaid: "Неплатено",
  pending: "Очаква плащане",
  paid: "Платено",
  expired: "Изтекло"
};

export const annualPlanDescriptions: Record<BusinessTier, string> = {
  free: "Основен профил в каталога след редакторско одобрение.",
  featured: "По-предна позиция и по-видимо представяне в избраната категория.",
  premium: "Силен визуален акцент и приоритетно позициониране в каталога.",
  homepage: "Премиум присъствие в каталога и възможност за фокус на началната страница."
};

export function getBusinessTierLabel(tier: BusinessTier) {
  return businessTierLabels[tier];
}
