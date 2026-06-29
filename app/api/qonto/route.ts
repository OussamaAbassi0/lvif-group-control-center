import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  const login  = process.env.QONTO_LOGIN;
  const secret = process.env.QONTO_SECRET_KEY;

  if (!login || !secret) {
    return NextResponse.json({ error: "Missing Qonto credentials" }, { status: 500 });
  }

  try {
    const res = await fetch("https://thirdparty.qonto.com/v2/organization", {
      headers: { Authorization: `${login}:${secret}`, "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `Qonto API ${res.status}`, detail: body }, { status: res.status });
    }

    const data = await res.json();
    const accounts: QontoAccount[] = data.organization?.bank_accounts ?? [];

    // Use authorized_balance_cents (what Qonto app shows — excludes pending transactions)
    const activeAccounts = accounts.filter(a => a.status === "active");
    const qontoBalance = activeAccounts.reduce((s, a) => s + (a.authorized_balance_cents ?? 0) / 100, 0);

    // BNP not accessible via Qonto partner API (aggregated accounts are app-only)
    // Charges fixes = Dépenses structurelles (14 507) + Frais bancaires remb. prêts (11 070)
    // Source: Qonto Trésorerie > Prévision — Juin 2026
    const CHARGES_FIXES = 25577;

    return NextResponse.json({
      accounts,
      active_accounts: activeAccounts,
      qonto_balance: qontoBalance,
      bnp_balance: null,        // Not accessible via Qonto API (app-only feature)
      bnp_note: "Compte BNP visible dans l'app Qonto mais non accessible via API partenaire",
      total: qontoBalance,      // Only Qonto accounts available via API
      charges_fixes: CHARGES_FIXES,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed", detail: String(err) }, { status: 500 });
  }
}

interface QontoAccount {
  slug: string; iban: string; bic: string; currency: string;
  balance: number; balance_cents: number;
  authorized_balance: number; authorized_balance_cents: number;
  name: string; status: string; main: boolean;
  is_external_account: boolean; updated_at: string;
}
