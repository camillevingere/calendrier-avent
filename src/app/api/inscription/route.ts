import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_ACCES, creerTicket, DUREE_ACCES_SECONDES } from "@/lib/acces";
import { autoriser, ipDe } from "@/lib/limite";
import { inscrireSurLumail } from "@/lib/lumail";

const Schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).refine((e) => e.length <= 254),
  // Champ invisible : seul un robot le remplit.
  site: z.string().max(0).optional(),
});

export const POST = async (requete: Request) => {
  if (!autoriser(ipDe(requete))) {
    return NextResponse.json({ erreur: "Doucement ! Trop d'essais d'un coup. Réessaie dans quelques minutes." }, { status: 429 });
  }

  const corps = await requete.json().catch(() => null);
  const donnees = Schema.safeParse(corps);
  if (!donnees.success) {
    return NextResponse.json({ erreur: "Cet email ne semble pas valide." }, { status: 400 });
  }

  const resultat = await inscrireSurLumail(donnees.data.email);
  if (resultat === "erreur") {
    return NextResponse.json({ erreur: "Le serveur a glissé sur une peau de banane. Réessaie dans un instant." }, { status: 502 });
  }

  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.set(COOKIE_ACCES, creerTicket(donnees.data.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_ACCES_SECONDES,
  });
  return reponse;
};
