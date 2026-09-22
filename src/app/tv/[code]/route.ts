import { NextResponse } from "next/server";
import { getDisplayTokenByCode } from "@/lib/business-platform/displays";

/**
 * Късият адрес за телевизора: bansko.now/tv/<5 знака> → /display/<token>.
 * На телевизор се пише трудно, затова собственикът въвежда само кода; след
 * пренасочването телевизорът стои на дългия таен адрес и работи както досега.
 * Без кеш: сменен код или спрян екран трябва да спрат веднага.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = await getDisplayTokenByCode(code);

  if (!token) {
    return new NextResponse("Няма такъв екран.", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  }

  const url = new URL(`/display/${token}`, request.url);
  return NextResponse.redirect(url, { status: 307, headers: { "Cache-Control": "no-store" } });
}
