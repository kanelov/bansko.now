import type { BusinessPaymentStatus, BusinessStatus, BusinessTier } from "@/lib/types";

export const businessTierLabels: Record<BusinessTier, string> = {
  free: "Безплатен",
  premium: "Премиум",
  homepage: "На фокус"
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
  premium: "Силен визуален акцент и приоритетно позициониране в каталога.",
  homepage: "Най-висока видимост в каталога и възможност за представяне на началната страница."
};

export function getBusinessTierLabel(tier: BusinessTier) {
  return businessTierLabels[tier];
}
