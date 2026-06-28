import { NextResponse } from "next/server";

export const revalidate = 300; // 5 min cache

export async function GET() {
  const login  = process.env.QONTO_LOGIN;
  const secret = process.env.QONTO_SECRET_KEY;

  if (!login || !secret) {
    return NextResponse.json({ error: "Missing Qonto credentials" }, { status: 500 });
  }

  try {
    const res = await fetch("https://thirdparty.qonto.com/v2/organization", {
      headers: {
        Authorization: `${login}:${secret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `Qonto API ${res.status}`, detail: body },
        { status: res.status }
      );
    }

    const data = await res.json();
    const accounts: QontoAccount[] = data.organization?.bank_accounts ?? [];

    // Separate Qonto accounts from external (BNP) accounts
    const qontoAccounts = accounts.filter(
      (a) => !a.bank_account_type || a.bank_account_type === "current"
    );
    const bnpAccounts = accounts.filter(
      (a) =>
        a.bank_account_type === "external" ||
        (a.name ?? "").toLowerCase().includes("bnp")
    );

    const qontoBalance = qontoAccounts.reduce(
      (s, a) => s + (a.balance_cents ?? 0) / 100,
      0
    );
    const bnpBalance = bnpAccounts.reduce(
      (s, a) => s + (a.balance_cents ?? 0) / 100,
      0
    );

    // Charges fixes from Qonto Trésorerie > Prévision (source: screenshot client 28/06/2026)
    // Dépenses structurelles: 14 507 € + Frais bancaires (remb. prêts): 11 070 €
    const CHARGES_FIXES = 25577;

    return NextResponse.json({
      accounts,
      qonto_balance: qontoBalance,
      bnp_balance:   bnpBalance,
      total:         qontoBalance + bnpBalance,
      charges_fixes: CHARGES_FIXES,
      updated_at:    new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Fetch failed", detail: String(err) },
      { status: 500 }
    );
  }
}

interface QontoAccount {
  slug:              string;
  iban:              string;
  bic:               string;
  currency:          string;
  balance_cents:     number;
  authorized_balance_cents: number;
  name:              string;
  bank_account_type?: string;
  updated_at:        string;
}
