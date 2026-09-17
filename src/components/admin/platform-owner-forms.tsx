"use client";

import { useActionState } from "react";
import { addBusinessOwnerAction, resetOwnerPasswordAction, type OwnerActionState } from "@/app/admin/platform-actions";

/**
 * Формите, които връщат временна парола. Паролата идва в състоянието на
 * формата и живее само в тази страница: не минава през адрес, бисквитка или
 * лог и изчезва при презареждане.
 */

function Result({ state }: { state: OwnerActionState }) {
  if (!state) return null;

  return (
    <div className={state.ok ? "rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950" : "rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900"} role="status">
      <p className="font-semibold">{state.message}</p>
      {state.password ? (
        <p className="mt-2">
          {state.email ? <span>{state.email} · </span> : null}
          парола: <code className="select-all rounded bg-white px-2 py-1 font-mono text-base">{state.password}</code>
        </p>
      ) : null}
    </div>
  );
}

export function AddOwnerForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(addBusinessOwnerAction, null);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="business_id" value={businessId} />
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="имейл на собственика"
          className="min-w-0 flex-1 rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm text-stone-950"
        />
        <button disabled={pending} className="admin-button admin-button-primary px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {pending ? "Създава се…" : "Добави собственик"}
        </button>
      </div>
      <Result state={state} />
    </form>
  );
}

export function ResetPasswordForm({ memberId }: { memberId: string }) {
  const [state, action, pending] = useActionState(resetOwnerPasswordAction, null);

  return (
    <form
      action={action}
      className="grid gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Да сменя ли паролата на този собственик? Старата спира веднага.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <button disabled={pending} className="admin-button admin-button-secondary w-fit px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
        {pending ? "Сменя се…" : "Нова парола"}
      </button>
      <Result state={state} />
    </form>
  );
}
