/**
 * POST /api/ia/commercial
 * Génération d'emails commerciaux via Claude (Anthropic API)
 * 
 * Corps de la requête :
 *   deal_title     : string  — titre du deal
 *   client_name    : string  — nom du client/prospect
 *   amount         : number  — montant en €
 *   status         : string  — stade pipeline
 *   next_action    : string  — prochaine action prévue
 *   email_type     : string  — type d'email à générer
 *   instructions   : string  — consignes supplémentaires libres
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText }  from "ai";
import { NextResponse }  from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `Tu es l'assistant commercial de Maxime Mussard, Directeur Commercial de LVIF Group.

## Contexte LVIF Group
LVIF (LED Visual Innovation France) est une entreprise spécialisée dans les écrans LED géants, la signalétique numérique et les solutions d'affichage événementielles et permanentes. Secteurs cibles : événementiel, retail, sport, corporate, outdoor.

Les entités du groupe :
- LVIF : écrans LED location/vente, murs d'images, signalétique
- Eno Events : production événementielle avec supports LED
- TJM : régie publicitaire numérique (affichage dynamique)

## Style de Maxime Mussard
- Ton direct, professionnel mais chaleureux — pas de formules trop académiques
- Phrases courtes et percutantes
- Met en avant la valeur business (ROI, impact visuel, différenciation)
- Utilise le prénom du contact quand disponible
- Signature : "Maxime Mussard | Directeur Commercial | LVIF Group | +33 6 09 62 28 24"
- Toujours une seule phrase d'accroche forte en ouverture
- Corps email : 3-4 paragraphes maximum
- Toujours une proposition de next step concrète (call, RDV, démo)
- Jamais de "Suite à notre conversation" en ouverture si c'est un premier contact

## Règles invariables
- Répondre UNIQUEMENT avec le texte de l'email (objet + corps)
- Format : Objet: [ligne d'objet]\n\n[corps de l'email]
- Langue : français, registre professionnel
- Pas de [entre crochets] dans le texte final — tout doit être rédigé
- Signature complète à la fin

## Types d'emails et leur logique
- Premier contact : Accroche sur le besoin spécifique du secteur, valeur LVIF, call to action 15 min
- Suivi de devis : Rappel discret, répondre à des objections potentielles, urgence douce
- Relance sans réponse : Ton direct "j'ai besoin d'un oui ou d'un non", nouvelle accroche
- Proposition commerciale : Résumé solution, prix justifié, délais, signature proposée
- Remerciement post-RDV : Points clés évoqués, prochaines étapes concrètes, enthousiasme mesuré`;

const EMAIL_TYPE_LABELS: Record<string, string> = {
  "premier_contact":  "Premier contact",
  "suivi_devis":      "Suivi de devis",
  "relance":          "Relance sans réponse",
  "proposition":      "Proposition commerciale",
  "remerciement_rdv": "Remerciement post-RDV",
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée — contactez l'administrateur." },
      { status: 503 }
    );
  }

  let body: {
    deal_title?: string;
    client_name?: string;
    amount?: number;
    status?: string;
    next_action?: string;
    email_type?: string;
    instructions?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)" }, { status: 400 });
  }

  const { deal_title, client_name, amount, status, next_action, email_type, instructions } = body;

  if (!email_type) {
    return NextResponse.json({ error: "email_type requis" }, { status: 400 });
  }

  const emailTypeLabel = EMAIL_TYPE_LABELS[email_type] ?? email_type;

  const userPrompt = `Génère un email de type "${emailTypeLabel}" pour le deal suivant :

Deal : ${deal_title ?? "Non renseigné"}
Client / Prospect : ${client_name ?? "Non renseigné"}
Montant : ${amount ? `${Number(amount).toLocaleString("fr-FR")} €` : "Non renseigné"}
Stade pipeline : ${status ?? "prospect"}
Prochaine action prévue : ${next_action ?? "Non renseignée"}
${instructions ? `\nConsignes supplémentaires de Maxime : ${instructions}` : ""}

Génère l'email maintenant. Commence directement par "Objet:".`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 800,
      temperature: 0.7,
    });

    return NextResponse.json({
      email:      text,
      email_type: emailTypeLabel,
      generated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[ia/commercial]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Génération échouée", detail: message },
      { status: 500 }
    );
  }
}
